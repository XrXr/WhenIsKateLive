import {
    find,
    add_class,
    remove_class
} from './utils';


var prefix = find("h3");
var countdown = find("h1").children[0];
var hide_class = "hidden";
var clock = "disguise";

export function update_countdown (live, countdown_string) {
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

var BLACK = "#333";
var GREY = "grey";

// highlight all the streams that starts on `today`. `today` is a day from
// moment. If no stream is happening on `today` highlight all streams
// that starts on the same day of `next_stream`
export function highlight_today(streams, today, next_stream) {
    var found = false;
    var i, j;

    for (i = 0; i < streams.length; i++) {
        for (j = 0; j < streams[i].dom_elements.length; j++) {
            if (streams[i].start.day() === today) {
                streams[i].dom_elements[j].style.color = BLACK;
                found = true;
            } else {
                streams[i].dom_elements[j].style.color = GREY;
            }
        }
    }
    if (!found) {
        var target_day = next_stream.start.day();
        for (i = 0; i < streams.length; i++) {
            if (streams[i].start.day() === target_day) {
                for (j = 0; j < streams[i].dom_elements.length; j++) {
                    streams[i].dom_elements[j].style.color = BLACK;
                }
            }
        }
    }
}
