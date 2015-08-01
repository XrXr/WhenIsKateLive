var child_proess = require("child_process");
var stream = require("stream");
var path = require("path");
var fs = require("fs-extra");
var acorn = require("acorn");
var schedule_path = path.join(__dirname, '../schedule.json');
var raw_schedule = loadSchedule();
var CleanCSS = require('clean-css');

var is_watch_mode = process.argv[2] === '--watch';
var build_base = path.resolve('.');
var source_base = path.resolve('./src');

var paths = (function() {
    var build_js = path.join(build_base, "js");
    var build_css = path.join(build_base, "styles");
    return {
        css: {
            in: path.join(source_base, "styles", "home.css"),
            out: path.join(build_css, "home.css")
        },
        js: {
            in: path.join(source_base, "js", "home.js"),
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
    var original = fs.readFileSync(paths.css.in, "utf8");
    var minified = new CleanCSS().minify(original).styles;
    fs.writeFileSync(paths.css.out, minified, "utf8");
}

function build_with_schedule () {
    var original = fs.readFileSync(paths.js.in, "utf8");
    var iopen = original.lastIndexOf("(");
    if (iopen === -1) {
        throw new Error("Could not find location to insert schedule in the original source");
    }
    var built = original.slice(0, iopen + 1) +
        JSON.stringify(raw_schedule) + ");";
    acorn.parse(built);
    return built;
}

function build_js() {
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
    meow.stdin.end(build_with_schedule(), "utf8");
    meow.on("exit", function (status) {
        if (status !== 0) {
            console.error("Compiling JavaScript with schedule info failed. Aborting");
            process.exit(1);
        }
    });
}

function loadSchedule () {
    return JSON.parse(fs.readFileSync(schedule_path));
}

function production_build () {
    console.log("Ensuring that build directories exist...");
    ensure_build_destination();
    console.log("Minifying " + paths.css.in + " to " + paths.css.out + " ...");
    minify_css();
    console.log("Minifying " + paths.js.in + " with schedule info to " +
                paths.js.out + " ...");
    build_js();
}

function _development_build (filename) {
    if (filename) {
        console.log(filename + " changed. Building...\n");
    }
    console.log("Ensuring that build directories exist...");
    ensure_build_destination();
    console.log("Copying " + paths.css.in + " to " + paths.css.out + " ...");
    fs.copySync(paths.css.in, paths.css.out);
    console.log("Building " + paths.js.in + " with schedule info to " +
                paths.js.out + " ...");
    fs.writeFileSync(paths.js.out, build_with_schedule());
    console.log("BUILD SUCCESSFUL".green);
}

function development_build (filename) {
    try {
        _development_build(filename);
    } catch(e) {
        console.log("BUILD FAILED".red);
        console.error((e.name + ": " + e.message).red);
    }
}

if (is_watch_mode) {
    var watch = require("node-watch");
    require('colors');
    development_build();
    console.log();
    console.log('Watching ' + source_base + ' ...');
    watch([source_base, schedule_path], development_build);
} else {
    production_build();
}