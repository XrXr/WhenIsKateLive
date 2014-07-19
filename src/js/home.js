(function(){
    "use strict";

    var to_local = (function(){
        var target_offset = (new Date()).getTimezoneOffset();
        return function(moment_instance){
            moment_instance.zone(target_offset);
            return moment_instance;
        };
    })();

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

        function Schedule(weekday_name, start, duration) {
            // This object makes schedule entries readable
            if (!(this instanceof Schedule)){
                return new Schedule(weekday_name, start, duration);
            }
            this.key = weekday_name.toLowerCase();
            this.start = start;
            this.isoWeekday = eng_to_iso(weekday_name);
            this.duration = duration;
        }
        // its probably better to construct these in less steps
        // however this is much more readable;
        var SCHEDULE = [Schedule("Monday", 20, 3),
                        Schedule("Tuesday", 13, 2),
                        Schedule("Thursday", 22, 2),
                        Schedule("Saturday", 20, 3)];

        function Stream(start_time, duration) {
            // new Stream() and Stream() both work
            if (!(this instanceof Stream)){
                return new Stream(start_time, duration);
            }
            this.start = start_time.clone();
            this.end = start_time.clone();
            this.end.add('hours', duration);
            this.duration = duration;
        }

        Stream.prototype.convert_time = function(){
            to_local(this.start);
            to_local(this.end);
        };

        Stream.prototype.normalize = function(){
            // move start and end to the first week of 1970
            this.start.year(1970);
            this.start.isoWeek(1);

            this.end.year(1970);
            this.end.isoWeek(1);
        };

        Stream.prototype.toString = function(){
            var start_signature = this.start.format("a");
            if (start_signature === this.end.format("a")){
                return this.start.format("h") + " to " +
                       this.end.format("h") + " " + start_signature;
            }
            return this.start.format("h a") + " to " + this.end.format("h a");
        };

        Stream.prototype.is_live = function(timestamp){
            // timestamp needs to be normalized first
            return timestamp >= this.start.unix() && timestamp <= this.end.unix();
        };

        var streams = {};
        var base = moment(0);
        base.zone(480); // PST = GMT-8, 8 * 60 = 480. PST's offset from gmt is 480 minutes
        var temp = null;
        Object.defineProperty(streams, "length", {value: SCHEDULE.length});
        SCHEDULE.forEach(function(e, index){
            temp = base.clone();
            temp.isoWeekday(e.isoWeekday);
            temp.hours(e.start);
            streams[index] = new Stream(temp, e.duration);
            streams[index].convert_time();
        });

        function compare_moment_instance (a, b) {
            return a.start.unix() - b.start.unix();
        }

        Object.defineProperty(streams, "get_sorted_array", {
            // return an array with all the Stream sorted in
            // chronological order
            value: (function(){
                // sort once
                var sorted = null;
                return function (){
                    if (sorted !== null){
                        return sorted;
                    }
                    var result = [];
                    for (var key in this) {
                        if (this.hasOwnProperty(key)) {
                            result.push(this[key]);
                        }
                    }
                    sorted = result.sort(compare_moment_instance);
                    return result;
                };
            })()
        });
        return streams;
    })();


    function normalize (moment_instance) {
        // return a Moment instance that has the same day of week and hour info
        // with the begining of the week at the Unix Epoch.
        // does not mutate the original
        var normalized = moment(0);
        // This should do nothing in a normal use case. However, if the system timezone is changed
        // during the execution of this script, this will make sure all the output is self consistent
        // (all times are converted to the first observed timezone)
        to_local(normalized);
        normalized.year(1970);
        normalized.isoWeek(1);
        normalized.isoWeekday(moment_instance.isoWeekday());
        normalized.hours(moment_instance.hours());
        normalized.minutes(moment_instance.minutes());
        normalized.seconds(moment_instance.seconds());
        return normalized;
    }

    function find_next_stream (streams, now) {
        // return a Stream that is currently live
        // if no such Stream exist, return the Stream with the closest start time
        var sorted = streams.get_sorted_array();
        var found;
        sorted.some(function(stream, index){
            if (now.isAfter(stream.end)){
                return false;  // continue
            }
            found = stream;
            return true; // break
        });
        if (!found){
            return sorted[0];
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

        function get_countdown (now_unix, stream) {
            var delta = stream.start.unix() - now_unix;
            if (delta > 0){
                return format_countdown(delta);
            }
            if (delta < 0){
                return format_countdown(stream.start.clone().add('weeks', 1).unix() - now_unix);
            }
            // this should never happen. See tick()
            throw new Error("get_countdown() called with Invalid arguments");
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
            if (node.className.match(get_regex(name).length === 0)){
                node.className += " " + name;
            }
        }

        function remove_class (node, name) {
            if (node.className.match(get_regex(name).length > 0)){
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
        var hide_class = "soft-hide";
        var clock = "disguise prefix";

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
    function tick() {
        // check if the stream currently holding is live
        // yes -> show dom
        // no  -> was the last live check yes?
        //        yes -> change holding stream to the next stream, recursion
        //         no -> calculate time until start, show dom
        var now = normalize(moment());
        var now_unix = now.unix();
        var is_live = stream.is_live(now_unix);
        if (is_live){
            last_check = true;
            return update_dom(true);
        }
        if (last_check){
            last_check = false;
            stream = find_next_stream(streams, now);
            return tick();
        }
        last_check = false;
        return update_dom(false, get_countdown(now_unix, stream));
    }
    /********Entry point*********/
    tick();
    setInterval(tick, 1000);
})();