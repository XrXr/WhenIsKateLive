var child_proess = require('child_process');
var path = require("path");
var fs = require("fs-extra");
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

function ensure_build_destination() {
    fs.ensureDirSync(paths.build_dir.base);
    fs.ensureDirSync(paths.build_dir.js);
    fs.ensureDirSync(paths.build_dir.css);
}

function minify_css() {
    var original = fs.readFileSync(paths.css.in, {encoding: "utf8"});
    var minified = new CleanCSS().minify(original);
    fs.writeFileSync(paths.css.out, minified, {encoding: "utf8"});
}

function minify_js() {
    child_proess.execSync("java -jar ./build_tools/compiler.jar --js " +
                          paths.js.in + " --js_output_file " + paths.js.out);
}

console.log("Ensuring that build directories exist...");
ensure_build_destination();
console.log("Minifying " + paths.js.in + " to " + paths.js.out + " ...");
minify_js();
console.log("Minifying " + paths.css.in + " to " + paths.css.out + " ...");
minify_css();