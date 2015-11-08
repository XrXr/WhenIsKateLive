var gulp = require('gulp'),
    rollup = require('rollup'),
    browserSync = require('browser-sync');

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

gulp.task('default', ['bundle']);

gulp.task('build-and-reload', ['bundle'], function () {
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

  gulp.watch(['*.html', 'css/**/*.css', 'js/**/*.js'], {cwd: 'src'}, ['build-and-reload']);
});