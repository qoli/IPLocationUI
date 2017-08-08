'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var nodemon = require('gulp-nodemon');
var sass = require('gulp-sass');

// 編譯 SASS 檔案
gulp.task('sass', function() {
  return gulp.src("public/scss/*.scss")
    .pipe(sass())
    .pipe(gulp.dest("public/stylesheets"))
    .pipe(browserSync.stream());
});

gulp.task('browser-sync', ['nodemon'], function() {

  browserSync.init({
    proxy: "http://localhost:3000",
    files: ["public/**/*.*", "routes/*.js", "views/**/*.*"],
    browser: "google chrome",
    reloadDelay: 1000,
    port: 7000
  });

  gulp.watch("*.pug").on("change", browserSync.reload);

});

gulp.task('nodemon', function(cb) {

  gulp.watch("public/scss/*.scss", ['sass']);
  var started = false;

  return nodemon({
    script: './bin/www',
    ignore: [
      'gulpfile.js',
      'node_modules/'
    ],
    ext: 'js pug'
  }).on('start', function() {
    if (!started) {
      cb();
      started = true;
    }
  })
});

gulp.task('default', ['browser-sync'], function() {});
