var child_proess = require("child_process");
var raw_schedule = require("../schedule.json");
var stream = require("stream");
var path = require("path");
var fs = require("fs-extra");
var CleanCSS = require('clean-css');

var paths = (function() {
    var build_base = path.resolve('.');
    var build_js = path.join(build_base, "js");
    var build_css = path.join(build_base, "styles");
    return {
        css: {
            in: path.join("./src", "styles", "home.css"),
            out: path.join(build_css, "home.css")
        },
        js: {
            in: path.join("./src", "js", "home.js"),
            out: path.join(build_js, "home.js")
        },
        build_dir: {
            "base": build_base,
            "js": build_js,
            "css": build_css
        }
    };
})();

function ensure_build_destination() {
    fs.ensureDirSync(paths.build_dir.base);
    fs.ensureDirSync(paths.build_dir.js);
    fs.ensureDirSync(paths.build_dir.css);
}

function minify_css() {
    var original = fs.readFileSync(paths.css.in, {encoding: "utf8"});
    var minified = new CleanCSS().minify(original).styles;
    fs.writeFileSync(paths.css.out, minified, {encoding: "utf8"});
}

function build_js() {
    var original = fs.readFileSync(paths.js.in, {encoding: "utf8"});
    var iopen = original.lastIndexOf("(");
    if (iopen === -1) {
        throw new Error("Could not find location to insert schedule in the original source");
    }
    var built = original.slice(0, iopen + 1) + "'" +
                JSON.stringify(raw_schedule) + "');";
    var s = new stream.Readable();
    s.push(built);
    s.push(null);
    var options = {
        stdio: [
            null,
            1,  // parent stdout
            2   // parent stderr
        ]
    };
    var meow = child_proess.spawn("java",
        ["-jar", "./build_tools/compiler.jar", "--js_output_file",
         paths.js.out], options);
    meow.stdin.end(built, "utf8");
    meow.on("exit", function (status) {
        if (status !== 0) {
            console.error("Compiling JavaScript with schedule info failed. Aborting");
            process.exit(1);
        }
    });
}

console.log("Ensuring that build directories exist...");
ensure_build_destination();
console.log("Minifying " + paths.css.in + " to " + paths.css.out + " ...");
minify_css();
console.log("Minifying " + paths.js.in + " with schedule info to " +
            paths.js.out + " ...");
build_js();