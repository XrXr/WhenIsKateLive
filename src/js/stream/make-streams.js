import {
    weekday_names,
    streamer_dst,
    visitor_timezone_offset
} from '../constants';

import Stream from './stream';

function eng_to_iso (name) {
    var lowered = name.toLowerCase();
    var index = weekday_names.indexOf(lowered);
    if (index === -1) {
        throw new Error("Invalid weekday name");
    }
    return index + 1;
}

// Make an array of Stream objects given an array of time slots
export default function make_streams (schedule) {
    var timezone_suffix = streamer_dst ? "-0700" : "-0800";
    var format = "h:m a Z E WW YYYY";

    function make_stream (slot) {
        return new Stream(moment(
                slot.time + " " + timezone_suffix + " " +
                eng_to_iso(slot.weekday) + " " + "1" + " 1970", format),
            slot.duration, slot.canceled);
    }

    if (window.export_internals) {
        window.streamer_dst = streamer_dst;
        window.visitor_timezone_offset = visitor_timezone_offset;
        window.make_stream = make_stream;
        window.Stream = Stream;
    }

    return schedule.map(make_stream).sort(function (a, b) {
        return a.start_normalized - b.start_normalized;
    });
}
