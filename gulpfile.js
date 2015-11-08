var gulp = require('gulp'),
    rollup = require('rollup'),
    livereload = require('gulp-livereload');

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

gulp.task('livereload', ['bundle'], function () {
    livereload.reload();
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('src/**/*.js', ['livereload']);
  return new Promise(function () {});
});