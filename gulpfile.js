var gulp = require('gulp'),
    rollup = require('rollup'),
    browserSync = require('browser-sync'),
    minifyCss = require('gulp-minify-css');

var ENTRY = 'src/js/main.js';
var DEST = 'js/main.js';

gulp.task('bundle', function() {
    return rollup.rollup({
        entry: ENTRY
    }).then(function (bundle) {
        return bundle.write({
            format: 'iife',
            dest: DEST
        });
    });
});

gulp.task('minify-css', function() {
  return gulp.src('src/styles/*.css')
    .pipe(minifyCss())
    .pipe(gulp.dest('./styles'));
});

gulp.task('default', ['minify-css', 'bundle']);

gulp.task('build-and-reload', ['minify-css', 'bundle'], function () {
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

  gulp.watch(['*.html', 'styles/**/*.css', 'js/**/*.js'], {cwd: 'src'}, ['build-and-reload']);
});
