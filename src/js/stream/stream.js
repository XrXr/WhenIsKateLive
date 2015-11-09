import {
    visitor_timezone_offset,
} from '../constants';

export default function Stream(start_time, duration, canceled) {
    this.start = start_time.clone().zone(visitor_timezone_offset);
    this.end = this.start.clone();
    this.end.add('hours', duration);
    this.duration = duration;
    // normalized to the start of the iso week
    this.start_normalized = this.start.unix() -
                            this.start.clone().
                            startOf("isoWeek").unix();
    this.end_normalized = this.end.unix() -
                          this.end.clone().startOf("isoWeek").unix();
    this.dom_elements = [];
    this.canceled = canceled;
}

Stream.prototype.toString = function() {
    var start = this.start;
    var end = this.end;
    var start_suffix = start.format("a");
    var end_suffix = end.format("a");

    var start_format = base_format(this.start);
    var end_format = base_format(this.end);

    // assume duration > 0. This is for making time like 10 to 12 am
    // less ambiguous
    if (start.isoWeekday() !== end.isoWeekday()) {
        return format_stream(start, start_format) + " for " +
            this.duration + " hours";
    }

    if (start_suffix === end_suffix) {
        start_format.pop();  // make "3pm to 5pm" "3 to 5pm"
    }
    return format_stream(start, start_format) + " to " +
        format_stream(end, end_format);

    function format_stream (stream, format_arr) {
        var hour = stream.hours();
        if (hour === 12) {
            return 'Noon';
        } else if (hour === 0) {
            return 'Beginning of day';
        }
        return stream.format(format_arr.join(" "));
    }
};

Stream.prototype.is_live = function(since_week_start) {
    // in seconds
    return since_week_start >= this.start_normalized &&
           since_week_start <= this.end_normalized;
};

function base_format (moment_instance) {
    return moment_instance.minutes() > 0 ? ["h:m", "a"] : ["h", "a"];
}
