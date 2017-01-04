var gulp = require('gulp');

/**
 * Build project
 */
gulp.task('dev', function() {

  return gulp.src(['./src/**/*.*'])
    .pipe(gulp.dest('./build'))
});


/**
 * Default tasks
 */
gulp.task('build', ['dev']);
gulp.task('default', ['build']);