// Return a Stream that is currently live. If no such Stream exists,
// return the Stream with the closest start time that is in the future.
// Canceled streams are ignored
export default function find_next_stream (streams, since_week_start) {
    streams = streams.filter(function (stream) {
        return !stream.canceled;
    });
    var found;
    streams.some(function(stream) {
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
