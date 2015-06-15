#When is Kate Live?

###The web page is live [here][live page] thanks to Github pages!

This is a web page that contains the following
 - Count down until the next [Kate Live]
 - Schedule of [Kate Live] in the browser's local time

This is inspired by [whenisnlss.com](http://whenisnlss.com/) and made at the request of this [Reddit post]

##Libraries used
 - [Moment.js]() (served with project)

##Building
The project uses [Closure Compiler] for JavaScript minification and [clean-css] for css minification.

#####To set up build environment:
1. Make sure `java` and `npm` are in `path`
2. Put a copy of `compiler.jar` into `./build_tools`
3. Run `npm install ./` at the root of the repo

#####To build:
`npm run build`

This command will put the minified JavaScript and css into their respective directory such that the page can be viewed normally via a web server rooted at the root of this repo. The schedule info is inserted into the built JavasScript.

##Testing
Tests are written with mocha and Chai

##License
[MIT](LICENSE.txt)

If you use part(s) of the project somehow, let me know! (You don't have to)

##Browser support
Haphazardly tested on Firefox 30 and Google Chrome 35. Mostly functional on IE 11.

There is no plan to support any version of IE

####Mobile
Thanks to Alexander-Prime's work(#5) The page supports mobile browsers!

[Reddit post]: http://www.reddit.com/r/KateArmy/comments/2a8gna/can_we_get_something_like_whenisnlsscom/
[live page]: http://xrxr.github.io/WhenIsKateLive/
[Kate Live]: http://www.twitch.tv/lovelymomo
[Closure Compiler]: https://developers.google.com/closure/compiler/
[clean-css]: https://www.npmjs.org/package/clean-css
[Moment.js]: http://momentjs.com/