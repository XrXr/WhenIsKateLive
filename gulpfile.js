var gulp = require('gulp'),
    rollup = require('rollup'),
    browserSync = require('browser-sync'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css');

gulp.task('compress', function() {
  return gulp.src('lib/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});



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

gulp.task('minify-js', ['bundle'], function() {
    return gulp.src('js/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('js'));
});

gulp.task('default', ['minify-css', 'minify-js']);

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
