// Author: XrXr
// https://github.com/XrXr/WhenIsKateLive
// License: MIT
(function(){
    "use strict";
    // is the streamer observing DST?
    var streamer_dst = moment().tz("america/vancouver").isDST();
    var visitor_timezone_offset = (new Date()).getTimezoneOffset();
    var streams = (function(){
        var weekday_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        function iso_to_eng (num) {
            if (num < 1 || num > 7 || !Number.isInteger(num)){
                throw new Error("Invalid iso day of week");
            }
            return weekday_names[num - 1];
        }

        function eng_to_iso (name) {
            var lowered = name.toLowerCase();
            var index = weekday_names.indexOf(lowered);
            if (index === -1){
                throw new Error("Invalid weekday name");
            }
            return index + 1;
        }

        function TimeSlot(weekday_name, start, duration) {
            // This object makes schedule entries readable
            if (!(this instanceof TimeSlot)){
                return new TimeSlot(weekday_name, start, duration);
            }
            this.start = start;
            this.isoWeekday = eng_to_iso(weekday_name);
            this.duration = duration;
        }
        // its probably better to construct these in less steps
        // however this is much more readable;
        var SCHEDULE = [TimeSlot("Monday",    "03:00 PM", 9),
                        TimeSlot("Tuesday",   "00:00 AM", 15),
                        TimeSlot("Wednesday", "11:00 AM", 2),
                        TimeSlot("Thursday",  "10:00 PM", 2),
                        TimeSlot("Saturday",  "8:00  PM", 3),
                        TimeSlot("Sunday",    "11:00 AM", 2)];

        function Stream(start_time, duration) {
            // new Stream() and Stream() both work
            if (!(this instanceof Stream)){
                return new Stream(start_time, duration);
            }
            this.start = start_time.clone().zone(visitor_timezone_offset);
            this.end = start_time.clone().zone(visitor_timezone_offset);
            this.end.add('hours', duration);
            this.duration = duration;
            // normalized to the start of the iso week
            this.start_normalized = this.start.unix() - this.start.clone().startOf("isoWeek").unix();
            this.end_normalized = this.end.unix() - this.end.clone().startOf("isoWeek").unix();
        }

        function get_base_format (moment_instance) {
            if (moment_instance.minutes() > 0){
                return ["h:m", "a"];
            }
            return ["h", "a"];
        }

        Stream.prototype.toString = function(){
            var start_signature = this.start.format("a");
            var end_signature = this.end.format("a");

            var start_format = get_base_format(this.start);
            var end_format = get_base_format(this.end);

            if (start_signature === end_signature){
                start_format.pop();
            }
            return this.start.format(start_format.join(" ")) +
                " to " + this.end.format(end_format.join(" "));
        };

        Stream.prototype.is_live = function(since_week_start){
            // in seconds
            return since_week_start >= this.start_normalized &&
                   since_week_start <= this.end_normalized;
        };

        var streams = {};
        var timezone_suffix = streamer_dst ? "-0700" : "-0800";
        var format = "h:m a Z E WW YYYY";

        function make_stream (time_slot) {
            return new Stream(moment(time_slot.start + " " + timezone_suffix +
                                        " " + time_slot.isoWeekday + " " + "1" + " 1970", format),
                                    time_slot.duration);
        }

        if (window.export_internals){
            window.streamer_dst = streamer_dst;
            window.visitor_timezone_offset = visitor_timezone_offset;
            window.TimeSlot = TimeSlot;
            window.make_stream = make_stream;
        }

        return SCHEDULE.map(make_stream);
    })();

    function find_next_stream (streams, since_week_start) {
        // return a Stream that is currently live
        // if no such Stream exist, return the Stream with;
        // the closest start time that is in the future
        var found;
        streams.some(function(stream, index){
            if (since_week_start > stream.end_normalized){
                return false;  // continue
            }
            found = stream;
            return true; // break
        });
        if (!found){
            return streams[0];
        }
        return found;
    }

    var get_countdown = (function(){
        function pluralize (integer, string) {
            var base = integer + " " + string;
            if (integer > 1){
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
            if (days){
                result.push(pluralize(days, 'day'));
            }
            if (hours){
                result.push(pluralize(hours, 'hour'));
            }
            if (minutes){
                result.push(pluralize(minutes, 'minute'));
            }
            if (seconds){
                result.push(pluralize(seconds, 'second'));
            }
            return result.join(", ");
        }

        var a_week = 604800;
        function get_countdown (now, target) {
            // in seconds
            var delta = target - now;
            if (delta > 0){
                return format_countdown(delta);
            }
            if (delta < 0){
                return format_countdown(target + a_week - now);
            }
            // this should never happen. See tick()
            throw new Error("get_countdown() called with invalid arguments");
        }
        return get_countdown;
    })();

    var update_dom = (function(){
        function find (selector) {
            return document.querySelector(selector);
        }

        function get_regex (name) {
            return new RegExp("(?:^|\\s)" +
                name + "(?!\\S)", 'g');
        }

        function add_class (node, name) {
            if (node.className === ""){
                node.className += " " + name;
            }
        }

        function remove_class (node, name) {
            if (!node.className){
                return;
            }
            if (node.className.match(get_regex(name)).length > 0){
                node.className = node.className.replace(get_regex(name), '');
            }
        }

        var trs = document.querySelectorAll('tr');
        var head_tr = trs[0];
        while (head_tr.children.length < streams.length){
            head_tr.appendChild(document.createElement("th"));
        }
        for (var i = 0; i < streams.length; i++) {
            head_tr.children[i].textContent = streams[i].start.format("dddd");
        }

        var body_tr = trs[1];
        while (body_tr.children.length < streams.length){
            body_tr.appendChild(document.createElement("td"));
        }
        for (var i = 0; i < streams.length; i++) {
            body_tr.children[i].textContent = streams[i].toString();
        }

        find("small").textContent = "All times are converted to your local time";

        var prefix = find("h3");
        var countdown = find("h1").children[0];
        var hide_class = "hidden";
        var clock = "disguise";

        function update_dom (live, countdown_string) {
            // second argument is ignored if live is true
            if (live){
                add_class(prefix, hide_class);
                remove_class(countdown, clock);
                countdown.textContent = "Kate is live right now! Click to watch";
                countdown.href = "http://www.twitch.tv/lovelymomo";
                return;
            }
            remove_class(prefix, hide_class);
            add_class(countdown, clock);
            countdown.textContent = countdown_string;
            countdown.href = "#";
        }
        return update_dom;
    })();

    var stream = streams[0];
    var last_check = true;
    // TODO: this needs better implementation
    // countdown dom update should be in the fastest lane
    function tick() {
        // check if the stream currently holding is live
        // yes -> show dom
        // no  -> was the last live check yes?
        //        yes -> change holding stream to the next stream, recursion
        //         no -> calculate time until start, show dom
        var now = moment();
        var now_unix = now.unix();
        var since_week_start = now_unix - now.clone().startOf("isoWeek").unix();
        var is_live = stream.is_live(since_week_start);
        if (is_live){
            last_check = true;
            return update_dom(true);
        }
        // TODO: this could be: check if now is after stream.end
        if (last_check){
            last_check = false;
            stream = find_next_stream(streams, since_week_start);
            return tick();
        }
        last_check = false;
        return update_dom(false, get_countdown(since_week_start, stream.start_normalized));
    }
    if (window.export_internals){
        window.get_countdown = get_countdown;
        window.streams = streams;
        window.find_next_stream = find_next_stream;
    }
    /********Entry point*********/
    tick();
    setInterval(tick, 1000);
})();