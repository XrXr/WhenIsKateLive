// Author: XrXr
// https://github.com/XrXr/WhenIsKateLive
// License: MIT
(function() {
    "use strict";
    // is the streamer observing DST?
    var an_hour = 3600;
    var a_week = 604800;
    var black = "#333";
    var grey = "grey";
    var streamer_dst = moment().tz("america/vancouver").isDST();
    var visitor_timezone_offset = (new Date()).getTimezoneOffset();
    var weekday_names = ["monday", "tuesday", "wednesday", "thursday",
                         "friday", "saturday", "sunday"];

    function eng_to_iso (name) {
        var lowered = name.toLowerCase();
        var index = weekday_names.indexOf(lowered);
        if (index === -1) {
            throw new Error("Invalid weekday name");
        }
        return index + 1;
    }

    function TimeSlot(weekday_name, start, duration) {
        this.start = start;
        this.isoWeekday = eng_to_iso(weekday_name);
        this.duration = duration;
    }

    // Make an array of Stream objects given an array of TimeSlots
    function make_streams (schedule) {
        function iso_to_eng (num) {
            if (num < 1 || num > 7 || !Number.isInteger(num)) {
                throw new Error("Invalid iso day of week");
            }
            return weekday_names[num - 1];
        }

        function Stream(start_time, duration) {
            this.start = start_time.clone().zone(visitor_timezone_offset);
            this.end = start_time.clone().zone(visitor_timezone_offset);
            this.end.add('hours', duration);
            this.duration = duration;
            // normalized to the start of the iso week
            this.start_normalized = this.start.unix() -
                                    this.start.clone().
                                    startOf("isoWeek").unix();
            this.end_normalized = this.end.unix() -
                                  this.end.clone().startOf("isoWeek").unix();
            this.dom_elements = [];
        }

        function get_base_format (moment_instance) {
            if (moment_instance.minutes() > 0) {
                return ["h:m", "a"];
            }
            return ["h", "a"];
        }

        Stream.prototype.toString = function() {
            var start_signature = this.start.format("a");
            var end_signature = this.end.format("a");

            var start_format = get_base_format(this.start);
            var end_format = get_base_format(this.end);

            if (start_signature === end_signature) {
                start_format.pop();
            }
            return this.start.format(start_format.join(" ")) +
                " to " + this.end.format(end_format.join(" "));
        };

        Stream.prototype.is_live = function(since_week_start) {
            // in seconds
            return since_week_start >= this.start_normalized &&
                   since_week_start <= this.end_normalized;
        };

        var streams = {};
        var timezone_suffix = streamer_dst ? "-0700" : "-0800";
        var format = "h:m a Z E WW YYYY";

        function make_stream (time_slot) {
            return new Stream(moment(
                    time_slot.start + " " + timezone_suffix + " " +
                    time_slot.isoWeekday + " " + "1" + " 1970", format),
                time_slot.duration);
        }

        if (window.export_internals) {
            window.streamer_dst = streamer_dst;
            window.visitor_timezone_offset = visitor_timezone_offset;
            window.TimeSlot = TimeSlot;
            window.make_stream = make_stream;
        }

        return schedule.map(make_stream);
    }

    function find_next_stream (streams, since_week_start) {
        // return a Stream that is currently live
        // if no such Stream exist, return the Stream with;
        // the closest start time that is in the future
        var found;
        streams.some(function(stream, index) {
            if (since_week_start > stream.end_normalized) {
                return false;  // continue
            }
            found = stream;
            return true; // break
        });
        if (!found) {
            return streams[0];
        }
        return found;
    }

    var get_countdown = (function() {
        function pluralize (integer, string) {
            var base = integer + " " + string;
            if (integer > 1) {
                return base + 's';
            }
            return base;
        }

        function format_countdown (in_seconds) {
            var duration = moment.duration(in_seconds * 1000);
            var days = duration.days();
            var hours = duration.hours();
            var minutes = duration.minutes();
            var seconds = duration.seconds();
            var result = [];
            if (days) {
                result.push(pluralize(days, 'day'));
            }
            if (hours) {
                result.push(pluralize(hours, 'hour'));
            }
            if (minutes) {
                result.push(pluralize(minutes, 'minute'));
            }
            if (seconds) {
                result.push(pluralize(seconds, 'second'));
            }
            return result.join(", ");
        }

        function get_countdown (now, target) {
            // in seconds
            if (now === target) {  // this should never happen. See tick()
                throw new Error(
                    "get_countdown() called with invalid arguments");
            }
            var delta = target - now;
            if (delta < 0) {
                delta += a_week;
            }
            return format_countdown(delta);
        }
        return get_countdown;
    })();

    function find (selector) {
        return document.querySelector(selector);
    }

    function add_class (node, name) {
        node.classList.add(name);
    }

    function remove_class (node, name) {
        node.classList.remove(name);
    }

    // populate the dom with schedule info and return a function used for
    // updating the countdown
    function initialize (streams) {
        // this will be [[Stream]], the streams that are in the same array
        // start on the same day
        var grouped = [];
        var max_same_day = 0;
        var processed = {};
        for (var i = 0; i < streams.length; i++) {
            if (i in processed) {
                continue;
            }
            processed[i] = 0;
            var current = streams[i];
            var current_day = [current];
            var day = current.start.isoWeekday();
            var week = current.start.isoWeek();
            var year = current.start.year();
            for (var j = 0; j < streams.length; j++) {
                if (j in processed) {
                    continue;
                }
                if (streams[j].start.isoWeekday() == day &&
                    streams[j].start.isoWeek() == week &&
                    streams[j].start.year() == year) {
                    current_day.push(streams[j]);
                    processed[j] = 0;
                }
            }
            if (current_day.length > max_same_day) {
                max_same_day = current_day.length;
            }
            grouped.push(current_day);
        }

        var head_tr = document.querySelector('tr');
        while (head_tr.children.length < grouped.length) {
            head_tr.appendChild(document.createElement("th"));
        }
        for (var i = 0; i < grouped.length; i++) {
            head_tr.children[i].textContent =
                grouped[i][0].start.format("dddd");
            // save reference to elements for highlighting later
            grouped[i][0].dom_elements.push(head_tr.children[i]);
        }

        var body = document.querySelector("tbody");
        while (body.children.length < max_same_day) {
            body.appendChild(document.createElement("tr"));
        }
        for (var i = 0; i < body.children.length; i++) {
            var current_tr = body.children[i];
            while (current_tr.children.length < grouped.length) {
                current_tr.appendChild(document.createElement("td"));
            }
            if (i !== 0) {
                current_tr.className = "auxiliary-slots";
            }
        }
        for (var i = 0; i < grouped.length; i++) {
            for (var j = 0; j < grouped[i].length; j++) {
                body.children[j].children[i].textContent =
                    grouped[i][j].toString();
                // save reference to elements for highlighting later
                grouped[i][j].dom_elements.push(body.children[j].children[i]);
                if (j >= 1) {
                    var same_line_element = document.createElement("span");
                    same_line_element.className = "same-line-slots";
                    same_line_element.textContent =
                        ", " + grouped[i][j].toString();
                    // this is for the mobile view, thus body.children[0]
                    body.children[0].children[i].appendChild(
                        same_line_element);
                }
            }
        }

        find("small").textContent =
            "All times are converted to your local time";

        var prefix = find("h3");
        var countdown = find("h1").children[0];
        var hide_class = "hidden";
        var clock = "disguise";

        function update_dom (live, countdown_string) {
            // second argument is ignored if live is true
            if (live) {
                add_class(prefix, hide_class);
                remove_class(countdown, clock);
                countdown.textContent =
                    "Kate is live right now! Click to watch";
                countdown.href = "http://www.twitch.tv/lovelymomo";
                return;
            }
            remove_class(prefix, hide_class);
            add_class(countdown, clock);
            countdown.textContent = countdown_string;
            countdown.href = "#";
        }
        return update_dom;
    }

    // highlight all the streams that starts on `today`. `today` is an integer
    // with Sunday as 0 and Saturday as 6. If no stream is happening on `today`
    // highlight all streams that starts on the same day of `next_stream`
    function highlight_today(streams, today, next_stream) {
        var found = false;
        for (var i = 0; i < streams.length; i++) {
            for (var j = 0; j < streams[i].dom_elements.length; j++) {
                if (streams[i].start.day() === today) {
                    streams[i].dom_elements[j].style.color = black;
                    found = true;
                } else {
                    streams[i].dom_elements[j].style.color = grey;
                }
            }
        }
        if (!found) {
            var target_day = next_stream.start.day();
            for (var i = 0; i < streams.length; i++) {
                if (streams[i].start.day() === target_day) {
                    for (var j = 0; j < streams[i].dom_elements.length; j++) {
                        streams[i].dom_elements[j].style.color = black;
                    }
                }
            }
        }
    }

    var loading_message_node = find("#loading-message");
    var countdown_block = find("#countdown");

    var get_schedule = new XMLHttpRequest();
    get_schedule.open("GET", "/schedule.json");
    get_schedule.responseType = "json";
    get_schedule.onload = function () {
        if (!this.response) {  // something went wrong
            loading_message_node.textContent =
                "Schedule loading failed! If this problem persists, " +
                "please contact the author";
            return;
        }
        var streams = make_streams(this.response.map(function (e) {
            return new TimeSlot(e.weekday, e.time, e.duration, e.canceled);
        }));
        var update_dom = initialize(streams);
        var stream = streams[0];
        // this flag indicates wheter a stream was live in the last check
        var last_check = true;
        var day_of_week = -1;  // trigger a highlight
        // TODO: this needs better implementation
        // countdown dom update should be in the fastest lane
        function tick() {
            // check if the stream currently holding is live
            // yes -> show dom
            // no  -> was the last live check yes?
            //        yes -> change holding stream to the next stream, recurse
            //         no -> calculate time until start, update dom
            var now = moment();
            var now_unix = now.unix();
            var since_week_start = now_unix -
                                   now.clone().startOf("isoWeek").unix();
            var since_day_start = now_unix - now.clone().startOf("day").unix();
            var new_day_of_week = now.day();
            if (new_day_of_week !== day_of_week) {
                highlight_today(streams, new_day_of_week, stream);
            }
            day_of_week = new_day_of_week;
            // this will be non-zero on the days that the DST adjustment
            // happens. On the day DST ends, the elapsed time at the end of the
            // day is 25 hours. On the day DST starts, it's 23 hours.
            var observed_difference = now.hour() -
                Math.floor(since_day_start / an_hour);
            since_week_start += observed_difference * an_hour;

            var is_live = stream.is_live(since_week_start);
            if (is_live) {
                last_check = true;
                return update_dom(true);
            }
            // TODO: this could be: check if now is after stream.end
            if (last_check) {
                last_check = false;
                stream = find_next_stream(streams, since_week_start);
                // stream is changed
                highlight_today(streams, new_day_of_week, stream);
                return tick();
            }
            last_check = false;
            return update_dom(false, get_countdown(since_week_start,
                                                   stream.start_normalized));
        }
        if (window.export_internals) {
            window.get_countdown = get_countdown;
            window.streams = streams;
            window.find_next_stream = find_next_stream;
            window.setTimeout(window.internal_exported, 0);
        }
        add_class(loading_message_node, "hidden");
        remove_class(countdown_block, "hidden");
        tick();
        setInterval(tick, 1000);
    };
    get_schedule.send();
})();