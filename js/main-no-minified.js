(function () { 'use strict';

  function find (selector) {
      return document.querySelector(selector);
  }

  function add_class (node, name) {
      node.classList.add(name);
  }

  function remove_class (node, name) {
      node.classList.remove(name);
  }

  var schedule_data = [
    {
      "weekday": "Monday",
      "time": "6:00 PM",
      "duration": undefined,
      "canceled": false
    },
    {
      "weekday": "Tuesday",
      "time": "6:00 PM",
      "duration": undefined,
      "canceled": false
    },
    {
      "weekday": "Wednesday",
      "time": "5:00 PM",
      "duration": undefined,
      "canceled": false
    },
    {
      "weekday": "Thursday",
      "time": "9:30 PM",
      "duration": undefined,
      "canceled": false
    },
    {
      "weekday": "Friday",
      "time": "5:00 PM",
      "duration": undefined,
      "canceled": false
    },
    {
      "weekday": "Saturday",
      "time": "3:00 PM",
      "duration": undefined,
      "canceled": false
    },
    {
      "weekday": "Sunday",
      "time": "4:00 PM",
      "duration": undefined,
      "canceled": false
    }
  ];

  // shared constants

  var an_hour = 3600;
  var a_week = 604800;
  // is the streamer observing DST?
  var streamer_dst = moment().tz("america/vancouver").isDST();
  var visitor_timezone_offset = (new Date()).getTimezoneOffset();
  var weekday_names = ["monday", "tuesday", "wednesday", "thursday",
                              "friday", "saturday", "sunday"];

  function Stream(start_time, duration, canceled) {
      this.start = start_time.clone().zone(visitor_timezone_offset);
      this.end = this.start.clone();
      this.end.add('hours', duration);
      this.duration = duration;
      var week_when_stream_starts = this.start.clone().startOf("isoWeek").unix();
      this.start_normalized = this.start.unix() - week_when_stream_starts;
      this.end_normalized = this.end.unix() - week_when_stream_starts;
      this.dom_elements = [];
      this.canceled = canceled;
  }

  Stream.prototype.toString = function() {
      var start = this.start;
      var end = this.end;
      var start_suffix = start.format("a");
      var end_suffix = end.format("a");

      var start_format = base_format(this.start);
      if (!this.duration) {
          return format_stream(start, start_format);
      }
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

      function format_stream (time, format_arr) {
          var hour = time.hours();
          var minutes = time.minutes();
          if (minutes === 0) {
              if (hour === 12) {
                  return 'Noon';
              } else if (hour === 0) {
                  return 'Beginning of day';
              }
          }
          return time.format(format_arr.join(" "));
      }
  };

  Stream.prototype.is_live = function(since_week_start) {
      if (!this.duration) {
          return false;
      }
      // in seconds
      return since_week_start >= this.start_normalized &&
          since_week_start <= this.end_normalized;
  };

  Stream.prototype.same_stream_next_week = function () {
      var clone = new Stream(this.start, this.duration);
      var one_week = moment.duration(1, 'week').asSeconds();
      clone.start_normalized += one_week;
      clone.end_normalized += one_week;
      return clone;
  }

  function base_format (moment_instance) {
      return moment_instance.minutes() > 0 ? ["h:m", "a"] : ["h", "a"];
  }

  function eng_to_iso (name) {
      var lowered = name.toLowerCase();
      var index = weekday_names.indexOf(lowered);
      if (index === -1) {
          throw new Error("Invalid weekday name");
      }
      return index + 1;
  }

  // Make an array of Stream objects given an array of time slots
  function make_streams (schedule) {
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

  // populate the dom tree with schedule info
  function display_schedule (grouped, max_same_day) {
      var i, j;

      var head_tr = find('tr');
      for (i = 0; i < grouped.length; i++) {
          var first_stream = grouped[i][0];
          var th = document.createElement("th");
          th.textContent = first_stream.start.format("dddd");
          // save reference to elements for highlighting later
          first_stream.dom_elements.push(th);
          head_tr.appendChild(th);
      }

      var body = find("tbody");
      for (i = 0; i < max_same_day; i++) {
          var tr = filled_tr(grouped.length);
          if (i !== 0) {
              tr.className = "auxiliary-slots";
          }
          body.appendChild(tr);
      }

      for (i = 0; i < grouped.length; i++) {
          for (j = 0; j < grouped[i].length; j++) {
              var target_stream = grouped[i][j];
              var target_element = body.children[j].children[i];

              target_element.appendChild(gen_schedule_node(target_stream));
              // save reference to elements for highlighting later
              target_stream.dom_elements.push(target_element);
              if (j >= 1) {
                  // this is for the mobile view, thus body.children[0]
                  body.children[0].children[i]
                      .appendChild(gen_schedule_node(target_stream, true));
              }
          }
      }

      function filled_tr (num_columns) {
          var tr = document.createElement("tr");
          while (tr.children.length < num_columns) {
              tr.appendChild(document.createElement("td"));
          }
          return tr;
      }
  }

  function gen_schedule_node (stream, same_line) {
      var node = document.createElement("span");
      var node_text = stream.toString();
      if (same_line) {
          node_text = ", " + node_text;
          add_class(node, "same-line-slots");
      }
      node.textContent = node_text;
      if (stream.canceled) {
          add_class(node, "canceled");
      }
      return node;
  }

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

  function get_countdown (now, target) {
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

  // Return a Stream that is currently live. If no such Stream exists,
  // return the Stream with the closest start time that is in the future.
  // Canceled streams are ignored
  function find_next_stream (streams, since_week_start) {
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

  var prefix = find("h3");
  var countdown = find("h1").children[0];
  var hide_class = "hidden";
  var clock = "disguise";

  function update_countdown (live, countdown_string) {
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

  // highlight all the streams that starts on `today`. `today` is an integer
  // with Sunday as 0 and Saturday as 6. If no stream is happening on `today`
  // highlight all streams that starts on the same day of `next_stream`
  function highlight_today(streams, today, next_stream) {
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
      // This is non-zero on the day of DST adjustment.
      // On the day DST ends, the elapsed time at the end of the day is 25 hours.
      // On the day DST starts, it's 23 hours.
      var observed_difference = now.hour() - Math.floor(since_day_start / an_hour);
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

  function tick() {
      var now = moment();
      var since_week_start = calc_since_week_start(now);
      var stream = find_next_stream(streams, since_week_start);
      highlight_today(streams, now.day(), stream);

      if (stream.is_live(since_week_start)) {
          update_countdown(true);
      } else {
          update_countdown(false, get_countdown(since_week_start,
                                                       stream.start_normalized));
      }
  }

  add_class(loading_message_node, "hidden");
  remove_class(countdown_block, "hidden");
  tick();
  setInterval(tick, 1000);

  if (window.export_internals) {
      window.calc_since_week_start = calc_since_week_start;
      window.find_next_stream = find_next_stream;
      window.get_countdown = get_countdown;
      window.streams = streams;
  }

})();