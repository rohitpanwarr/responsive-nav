var gulp = require('gulp');
var clean = require('gulp-rimraf');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var jsmin = require('gulp-jsmin');

/**
 * Build project
 */

gulp.task('clean', function() {
  return gulp.src(['./build'], {
      read: false
    })
    .pipe(clean());
});

gulp.task('sass', ['clean'], function () {
  return gulp.src(['./src/css/*.scss'])
    .pipe(sass().on('error', sass.logError))
    .pipe(minifyCss())
    .pipe(gulp.dest('./build/css'));
});

gulp.task('fonts', ['clean'], function() {
  return gulp.src(['./src/css/fonts/*/*.*'])
    .pipe(gulp.dest('./build/css/fonts'))
});

gulp.task('js:min', ['clean'], function() {
  return gulp.src(['./src/**/*.js'])
    .pipe(jsmin())
    .pipe(gulp.dest('./build'))
});


/**
 * Default tasks
 */
gulp.task('build', ['sass', 'fonts', 'js:min']);
gulp.task('default', ['build']);