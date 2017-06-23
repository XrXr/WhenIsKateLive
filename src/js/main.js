// Author: XrXr
// https://github.com/XrXr/WhenIsKateLive
// License: MIT

import schedule_data from './schedule';
import { an_hour } from './constants';
import display_schedule from './dom-manip/display-schedule';
import make_streams from './stream/make-streams';
import { add_class, remove_class, find } from './dom-manip/utils';
import find_next_stream from './stream/find-next-stream';
import { highlight_today, update_countdown } from './dom-manip/update';
import get_countdown from './get-countdown';


// Return [[Stream]]. The streams that are in the same array start on the
// same day
function group_streams (streams) {
    var i, j;

    var grouped = [];
    var processed = {};

    for (i = 0; i < streams.length; i++) {
        if (i in processed) {
            continue;
        }
        processed[i] = 0;
        var current = streams[i];
        var same_day = [current];
        var day = current.start.isoWeekday();
        for (j = 0; j < streams.length; j++) {
            if (j in processed) {
                continue;
            }
            if (streams[j].start.isoWeekday() === day) {
                same_day.push(streams[j]);
                processed[j] = 0;
            }
        }
        grouped.push(same_day);
    }
    return grouped;
}

// now :: Moment
function calc_since_week_start (now) {
    var now_unix = now.unix();
    var since_week_start = now_unix -
                           now.clone().startOf("isoWeek").unix();
    var since_day_start = now_unix - now.clone().startOf("day").unix();
    // this will be non-zero on the days that the DST adjustment
    // happens. On the day DST ends, the elapsed time at the end of the
    // day is 25 hours. On the day DST starts, it's 23 hours.
    var observed_difference = now.hour() -
        Math.floor(since_day_start / an_hour);
    since_week_start += observed_difference * an_hour;
    return since_week_start;
}

var countdown_block = find("#countdown");
var loading_message_node = find("#loading-message");

var streams = make_streams(schedule_data);
var grouped_streams = group_streams(streams);
var max_same_day = Math.max.apply(null, grouped_streams.map(function (e) {
    return e.length;
}));
display_schedule(grouped_streams, max_same_day);

var stream = streams[0];
var current_day_of_week = -1;  // trigger a highlight
function tick() {
    var now = moment();
    var since_week_start = calc_since_week_start(now);
    var new_day_of_week = now.day();
    if (new_day_of_week !== current_day_of_week) {
        highlight_today(streams, new_day_of_week, stream);
    }
    current_day_of_week = new_day_of_week;

    if (stream.is_live(since_week_start)) {
        return update_countdown(true);
    }

    if (since_week_start > stream.end_normalized) {
        stream = find_next_stream(streams, since_week_start);
        // stream is changed
        highlight_today(streams, new_day_of_week, stream);
        return tick();
    }
    return update_countdown(false, get_countdown(since_week_start,
                                                 stream.start_normalized));
}

add_class(loading_message_node, "hidden");
remove_class(countdown_block, "hidden");
tick();
setInterval(tick, 1000);

if (window.export_internals) {
    window.get_countdown = get_countdown;
    window.streams = streams;
    window.find_next_stream = find_next_stream;
}
