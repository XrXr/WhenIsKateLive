var gulp = require('gulp'),
    rollup = require('rollup'),
    browserSync = require('browser-sync'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    minifyCss = require('gulp-clean-css');

var ENTRY = 'src/js/main.js';
var MIN_DEST = 'js/main.js';
var NORMAL_DEST = 'js/main-no-minified.js';

gulp.task('bundle', function() {
    return rollup.rollup({
        entry: ENTRY
    }).then(function(bundle) {
        return Promise.all([
            bundle.write({
                format: 'iife',
                dest: NORMAL_DEST
            }),
            bundle.write({
                format: 'iife',
                dest: NORMAL_DEST
            })
        ]);
    });
});

gulp.task('minify-css', function() {
    return gulp.src('src/styles/*.css')
        .pipe(minifyCss())
        .pipe(gulp.dest('./styles'));
});

gulp.task('minify-js', ['bundle'], function() {
    return gulp.src(NORMAL_DEST)
        .pipe(uglify())
        .pipe(rename('main.js'))
        .pipe(gulp.dest('js'));
});

gulp.task('build-and-reload', ['default'], function() {
    browserSync.reload();
});

gulp.task('serve', function(cb) {
    browserSync({
        server: {
            baseDir: './'
        },
        notify: false,
        ui: false,
        ghostMode: false
    });

    gulp.watch(['*.html', 'styles/**/*.css', 'js/**/*.js'], {
        cwd: 'src'
    }, ['build-and-reload']);
});

gulp.task('default', ['minify-css', 'minify-js']);
