(function(){function p(a,b){var e;a.some(function(a,f){if(b>a.end_normalized)return!1;e=a;return!0});return e?e:a[0]}function l(){var a=moment(),a=a.unix()-a.clone().startOf("isoWeek").unix();if(m.is_live(a))return k=!0,q(!0);if(k)return k=!1,m=p(h,a),l();k=!1;return q(!1,r(a,m.start_normalized))}var s=moment().tz("america/vancouver").isDST(),n=(new Date).getTimezoneOffset(),h=function(){function a(d,e,b){if(!(this instanceof a))return new a(d,e,b);this.start=e;d=d.toLowerCase();d=c.indexOf(d);if(-1===
d)throw Error("Invalid weekday name");this.isoWeekday=d+1;this.duration=b}function b(d,a){if(!(this instanceof b))return new b(d,a);this.start=d.clone().zone(n);this.end=d.clone().zone(n);this.end.add("hours",a);this.duration=a;this.start_normalized=this.start.unix()-this.start.clone().startOf("isoWeek").unix();this.end_normalized=this.end.unix()-this.end.clone().startOf("isoWeek").unix()}function e(a){return new b(moment(a.start+" "+g+" "+a.isoWeekday+" 1 1970","h:m a Z E WW YYYY"),a.duration)}var c=
"monday tuesday wednesday thursday friday saturday sunday".split(" "),f=[a("Monday","03:00 PM",9),a("Tuesday","00:00 AM",15),a("Wednesday","11:00 AM",2),a("Thursday","10:00 PM",2),a("Saturday","8:00  PM",3),a("Sunday","11:00 AM",2)];b.prototype.toString=function(){var a=this.start.format("a"),e=this.end.format("a"),c=0<this.start.minutes()?["h:m","a"]:["h","a"],b=0<this.end.minutes()?["h:m","a"]:["h","a"];a===e&&c.pop();return this.start.format(c.join(" "))+" to "+this.end.format(b.join(" "))};b.prototype.is_live=
function(a){return a>=this.start_normalized&&a<=this.end_normalized};var g=s?"-0700":"-0800";window.export_internals&&(window.streamer_dst=s,window.visitor_timezone_offset=n,window.TimeSlot=a,window.make_stream=e);return f.map(e)}(),r=function(){function a(a,c){var b=a+" "+c;return 1<a?b+"s":b}function b(b){var c=moment.duration(1E3*b);b=c.days();var f=c.hours(),g=c.minutes(),c=c.seconds(),d=[];b&&d.push(a(b,"day"));f&&d.push(a(f,"hour"));g&&d.push(a(g,"minute"));c&&d.push(a(c,"second"));return d.join(", ")}
return function(a,c){var f=c-a;if(0<f)return b(f);if(0>f)return b(c+604800-a);throw Error("get_countdown() called with invalid arguments");}}(),q=function(){function a(a,b){a.className&&0<a.className.match(new RegExp("(?:^|\\s)"+b+"(?!\\S)","g")).length&&(a.className=a.className.replace(new RegExp("(?:^|\\s)"+b+"(?!\\S)","g"),""))}for(var b=document.querySelectorAll("tr"),e=b[0];e.children.length<h.length;)e.appendChild(document.createElement("th"));for(var c=0;c<h.length;c++)e.children[c].textContent=
h[c].start.format("dddd");for(b=b[1];b.children.length<h.length;)b.appendChild(document.createElement("td"));for(c=0;c<h.length;c++)b.children[c].textContent=h[c].toString();document.querySelector("small").textContent="All times are converted to your local time";var f=document.querySelector("h3"),g=document.querySelector("h1").children[0];return function(b,c){b?(""===f.className&&(f.className+=" hidden"),a(g,"disguise"),g.textContent="Kate is live right now! Click to watch",g.href="http://www.twitch.tv/lovelymomo"):
(a(f,"hidden"),""===g.className&&(g.className+=" disguise"),g.textContent=c,g.href="#")}}(),m=h[0],k=!0;window.export_internals&&(window.get_countdown=r,window.streams=h,window.find_next_stream=p);l();setInterval(l,1E3)})();
