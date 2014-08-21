var shell = require("shelljs");
var path = require("path");
var fs = require("fs");
var CleanCSS = require('clean-css');

var paths = (function() {
    var build_base = path.join("./build");
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

function create_build_dir() {
    fs.mkdirSync();
}

function minify_css() {
    var original = fs.readFileSync(paths.css.in, {encoding: "utf8"});
    var minified = new CleanCSS().minify(original);
    fs.writeFileSync(paths.css.out, minified, {encoding: "utf8"});
}

function minify_js() {
    var result =
        shell.exec("java -jar ./build_tools/compiler.jar --js " +
                   paths.js.in + " --js_output_file " + paths.js.out);
}

console.log("Making build directories...");
try{fs.mkdirSync(paths.build_dir.base);}catch(_){}
try{fs.mkdirSync(paths.build_dir.js);}catch(_){}
try{fs.mkdirSync(paths.build_dir.css);}catch(_){}
console.log("Minifying " + paths.js.in + " to " + paths.js.out + " ...");
minify_js();
console.log("Minifying " + paths.css.in + " to " + paths.css.out + " ...");
minify_css();