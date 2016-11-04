!function(){"use strict";function e(e){return document.querySelector(e)}function t(e,t){e.classList.add(t)}function n(e,t){e.classList.remove(t)}function r(e,t,n){this.start=e.clone().zone(x),this.end=this.start.clone(),this.end.add("hours",t),this.duration=t,this.start_normalized=this.start.unix()-this.start.clone().startOf("isoWeek").unix(),this.end_normalized=this.end.unix()-this.end.clone().startOf("isoWeek").unix(),this.dom_elements=[],this.canceled=n}function o(e){return e.minutes()>0?["h:m","a"]:["h","a"]}function a(e){var t=e.toLowerCase(),n=z.indexOf(t);if(n===-1)throw new Error("Invalid weekday name");return n+1}function i(e){function t(e){return new r(moment(e.time+" "+n+" "+a(e.weekday)+" 1 1970",o),e.duration,e.canceled)}var n=k?"-0700":"-0800",o="h:m a Z E WW YYYY";return window.export_internals&&(window.streamer_dst=k,window.visitor_timezone_offset=x,window.make_stream=t,window.Stream=r),e.map(t).sort(function(e,t){return e.start_normalized-t.start_normalized})}function d(t,n){function r(e){for(var t=document.createElement("tr");t.children.length<e;)t.appendChild(document.createElement("td"));return t}var o,a,i=e("tr");for(o=0;o<t.length;o++){var d=t[o][0],u=document.createElement("th");u.textContent=d.start.format("dddd"),d.dom_elements.push(u),i.appendChild(u)}var l=e("tbody");for(o=0;o<n;o++){var c=r(t.length);0!==o&&(c.className="auxiliary-slots"),l.appendChild(c)}for(o=0;o<t.length;o++)for(a=0;a<t[o].length;a++){var m=t[o][a],h=l.children[a].children[o];h.appendChild(s(m)),m.dom_elements.push(h),a>=1&&l.children[0].children[o].appendChild(s(m,!0))}}function s(e,n){var r=document.createElement("span"),o=e.toString();return n&&(o=", "+o,t(r,"same-line-slots")),r.textContent=o,e.canceled&&t(r,"canceled"),r}function u(e,t){e=e.filter(function(e){return!e.canceled});var n;return e.some(function(e){return!(t>e.end_normalized)&&(n=e,!0)}),n?n:e[0]}function l(e,t){var n=e+" "+t;return e>1?n+"s":n}function c(e){var t=moment.duration(1e3*e),n=t.days(),r=t.hours(),o=t.minutes(),a=t.seconds(),i=[];return n&&i.push(l(n,"day")),r&&i.push(l(r,"hour")),o&&i.push(l(o,"minute")),a&&i.push(l(a,"second")),i.join(", ")}function m(e,t){if(e===t)throw new Error("get_countdown() called with invalid arguments");var n=t-e;return n<0&&(n+=g),c(n)}function h(e,r){return e?(t(C,W),n(M,S),M.textContent="Kate is live right now! Click to watch",void(M.href="http://www.twitch.tv/lovelymomo")):(n(C,W),t(M,S),M.textContent=r,void(M.href="#"))}function f(e,t,n){var r,o,a=!1;for(r=0;r<e.length;r++)for(o=0;o<e[r].dom_elements.length;o++)e[r].start.day()===t?(e[r].dom_elements[o].style.color=E,a=!0):e[r].dom_elements[o].style.color=P;if(!a){var i=n.start.day();for(r=0;r<e.length;r++)if(e[r].start.day()===i)for(o=0;o<e[r].dom_elements.length;o++)e[r].dom_elements[o].style.color=E}}function w(e){var t,n,r=[],o={};for(t=0;t<e.length;t++)if(!(t in o)){o[t]=0;var a=e[t],i=[a],d=a.start.isoWeekday();for(n=0;n<e.length;n++)n in o||e[n].start.isoWeekday()===d&&(i.push(e[n]),o[n]=0);r.push(i)}return r}function y(e){var t=e.unix(),n=t-e.clone().startOf("isoWeek").unix(),r=t-e.clone().startOf("day").unix(),o=e.hour()-Math.floor(r/_);return n+=o*_}function v(){var e=moment(),t=y(e),n=e.day();return n!==N&&f(Y,n,D),N=n,D.is_live(t)?(I=!0,h(!0)):I?(I=!1,D=u(Y,t),f(Y,n,D),v()):(I=!1,h(!1,m(t,D.start_normalized)))}var p=[{weekday:"Monday",time:"6:00 PM",duration:2,canceled:!1},{weekday:"Tuesday",time:"6:00 PM",duration:3,canceled:!1},{weekday:"Thursday",time:"9:00 PM",duration:2,canceled:!1},{weekday:"Friday",time:"1:00 PM",duration:2,canceled:!1},{weekday:"Saturday",time:"3:00 PM",duration:2,canceled:!1},{weekday:"Saturday",time:"6:00 PM",duration:3,canceled:!1},{weekday:"Sunday",time:"4:00 PM",duration:2,canceled:!1}],_=3600,g=604800,k=moment().tz("america/vancouver").isDST(),x=(new Date).getTimezoneOffset(),z=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];r.prototype.toString=function(){function e(e,t){var n=e.hours();return 12===n?"Noon":0===n?"Beginning of day":e.format(t.join(" "))}var t=this.start,n=this.end,r=t.format("a"),a=n.format("a"),i=o(this.start),d=o(this.end);return t.isoWeekday()!==n.isoWeekday()?e(t,i)+" for "+this.duration+" hours":(r===a&&i.pop(),e(t,i)+" to "+e(n,d))},r.prototype.is_live=function(e){return e>=this.start_normalized&&e<=this.end_normalized};var C=e("h3"),M=e("h1").children[0],W="hidden",S="disguise",E="#333",P="grey",O=e("#countdown"),T=e("#loading-message"),Y=i(p),L=w(Y),j=Math.max.apply(null,L.map(function(e){return e.length}));d(L,j);var D=Y[0],I=!0,N=-1;window.export_internals&&(window.get_countdown=m,window.streams=Y,window.find_next_stream=u,window.setTimeout(window.internal_exported,0)),t(T,"hidden"),n(O,"hidden"),v(),setInterval(v,1e3)}();