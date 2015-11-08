import { a_week } from './constants';

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

export default function get_countdown (now, target) {
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