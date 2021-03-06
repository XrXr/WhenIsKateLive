import Stream from './stream';

// Return a Stream that is currently live. If no such Stream exists,
// return the Stream with the closest start time that is in the future.
// Canceled streams are ignored
export default function find_next_stream (streams, since_week_start) {
    streams = streams.filter(function (stream) {
        return !stream.canceled;
    });
    var found;
    for (var i = 0; i < streams.length; i++) {
        var stream = streams[i];
        if (since_week_start > stream.end_normalized) {
            continue;
        }
        found = stream;
        break;
    }
    if (!found) {
        return streams[0].same_stream_next_week();
    }
    return found;
}
