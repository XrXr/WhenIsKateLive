// shared constants

export var an_hour = 3600;
export var a_week = 604800;
// is the streamer observing DST?
export var streamer_dst = moment().tz("america/vancouver").isDST();
export var visitor_timezone_offset = (new Date()).getTimezoneOffset();
export var weekday_names = ["monday", "tuesday", "wednesday", "thursday",
                            "friday", "saturday", "sunday"];