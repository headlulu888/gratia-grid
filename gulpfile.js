"use strict";

// Gulp
var gulp = require("gulp");
var del = require("del");
var rename = require("gulp-rename");
var plumber = require("gulp-plumber");
var pump = require("pump");

// HTML
var htmlmin = require("gulp-htmlmin");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");

// CSS
var sass = require("gulp-sass");
var csso = require("gulp-csso");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");

// JS
var uglify = require("gulp-uglify");
var concat = require("gulp-concat");

// IMAGES
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var svgmin = require("gulp-svgmin");
var svgstore = require("gulp-svgstore");

// OTHER
var server = require("browser-sync").create();
var run = require("run-sequence");
var ghpages = require("gh-pages");

gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(plumber())
    .pipe(posthtml([
      include()
    ]))
    .pipe(htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      sortAttributes: true,
      sortClassName: true,
      minifyJS: true,
      minifyURLs: true
    }))
    .pipe(gulp.dest("build"))
});

gulp.task("style", function () {
  gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest("build/css"))
    .pipe(csso())
    .pipe(rename({suffix: ".min"}))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

gulp.task("script-min", function (cb) {
  pump([
    gulp.src("source/js/**/*.js"),
    uglify(),
    rename({suffix: ".min"}),
    gulp.dest("build/js")
  ], cb);
});

gulp.task("script-concat", function (cb) {
  pump([
    gulp.src(["source/js/**/*.js"]),
    uglify(),
    concat("script.min.js"),
    gulp.dest("build/js")
  ], cb);
});

gulp.task("images", function () {
  return gulp.src("source/img/raster/**/*.{jpg,png}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true})
    ]))
    .pipe(gulp.dest("build/img/raster"))
});

gulp.task("webp", function () {
  return gulp.src("source/img/raster/**/*.{png,jpg}")
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build/img/webp"));
});

gulp.task("svg", function () {
  return gulp.src("source/img/svg/**/*.svg")
    .pipe(svgmin())
    .pipe(gulp.dest("build/img/svg"))
});

gulp.task("sprite", function () {
  return gulp.src("build/img/svg/sprite/*.svg")
    .pipe(svgstore({
      inLineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img/svg"))
});

gulp.task("serve", function () {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });
  gulp.watch("source/sass/**/*.{scss,sass}", ["style"]);
  gulp.watch("source/*.html", ["html"]).on("change", server.reload);
  gulp.watch("source/js/*.js", ["script-min", "script-concat"]).on("change", server.reload);
});

gulp.task("copy", function () {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
  ], {
    base: "source/"
  })
  .pipe(gulp.dest("build"));
});

gulp.task("clean", function () {
  return del("build");
});

gulp.task("build", function (done) {
  run(
    "clean",
    "copy",
    "style",
    "script-min",
    "script-concat",
    "webp",
    "images",
    "svg",
    "sprite",
    "html",
    done
  );
});

ghpages.publish("build");
