var gulp = require('gulp');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var sassInheritance = require('gulp-sass-inheritance');
var gulpif = require('gulp-if');
var connect = require('gulp-connect');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var jasmine = require('gulp-jasmine');

var paths = {
  source: {scripts: './javascript/**/*.js', stylesheets: './stylesheets/**/*.scss', html: '*.html', css: './css/*.css'},
  target: {scripts: './js', stylesheets: './css'}
};

gulp.task('webserver', function() {
    connect.server({livereload: true});
});

gulp.task('lint', function() {
  return gulp.src(paths.source.scripts)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
});

gulp.task('minifyjs', ['lint'], function () {
  return gulp.src(paths.source.scripts)
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(rename({
            suffix: '.min'
        }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.target.scripts));
});

gulp.task('sass', function () {
    return gulp.src(paths.source.stylesheets)
      .pipe(sourcemaps.init())    
      .pipe(sass({includePaths: '/node_modules/lcc_frontend_toolkit/stylesheets'}).on('error', function (err) {
          notify({ title: 'SASS Task' }).write(err.line + ': ' + err.message);
          this.emit('end');
      }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./css'))

});

gulp.task('watch', function () {
    gulp.watch([paths.source.html, paths.source.css], ['statics:watch']);
    gulp.watch(paths.source.stylesheets, ['sass:watch']);
    gulp.watch(paths.source.scripts, ['minifyjs']);
});

var inheritanceCondition = function (file) {
    //as a result of this, only partials will trigger inheritance compiling
    //i.e. if a full file (not a partial) (1) is imported by another (2), changes to (1) will not trigger compilation in (2)
    var filepath = file.history[0];
    var filename = filepath.replace(/^.*[\\\/]/, '');
    return /\/_/.test(filename) || /^_/.test(filename); // check whether partial (starts with '_');
};

gulp.task('statics:watch', function() {
    return gulp.src([paths.source.css, paths.source.html])
        .pipe(connect.reload());
});

gulp.task('sass:watch', function() {
    return gulp.src(paths.source.stylesheets)
        .pipe(sourcemaps.init())    
        .pipe(plumber())
        .pipe(gulpif(inheritanceCondition, sassInheritance({dir: 'stylesheets/'})))
        .pipe(sass({includePaths: '/node_modules/lcc_frontend_toolkit/stylesheets'}).on('error', function (err) {
            notify({ title: 'SASS Task' }).write(err.line + ': ' + err.message);
            this.emit('end');
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.target.stylesheets))
        .pipe(connect.reload());
});

gulp.task('test', function () {
  return gulp.src('./spec/*.js')
        .pipe(jasmine())
});

gulp.task('default', ['lint', 'test', 'webserver', 'watch']);
