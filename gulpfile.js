/**
 * Gulp Packages
 */

// General
var gulp = require('gulp');
var fs = require('fs');
var del = require('del');
var lazypipe = require('lazypipe');
var plumber = require('gulp-plumber');
var flatten = require('gulp-flatten');
var tap = require('gulp-tap');
var rename = require('gulp-rename');
var header = require('gulp-header');
var footer = require('gulp-footer');
var watch = require('gulp-watch');
var livereload = require('gulp-livereload');
var package = require('./package.json');
var cacheBuster = require('gulp-cachebust');


// Scripts and tests
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

// Styles
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var minify = require('gulp-cssnano');
var sourcemaps = require('gulp-sourcemaps');

// SVGs
var svgmin = require('gulp-svgmin');
var svgstore = require('gulp-svgstore');

// Docs
var markdown = require('gulp-markdown');
var fileinclude = require('gulp-file-include');

var cachebust = new cacheBuster();
/**
 * Paths to project folders
 */

var paths = {
    input: 'src/**/*',
    output: 'dist/',
    scripts: {
        input: 'src/js/*',
        output: 'dist/js/'
    },
    styles: {
        input: 'src/sass/**/*.{scss,sass}',
        output: 'dist/css/'
    },
    svgs: {
        input: 'src/svg/*',
        output: 'dist/svg/'
    },
    images: {
        input: 'src/img/*',
        output: 'dist/img/'
    },
    static: {
        input: 'src/static/*',
        output: 'dist/'
    },
    docs: {
        input: 'src/docs/*.{html,md,markdown}',
        output: 'dist/',
        templates: 'src/docs/_templates/'
    }
};

/**
 * Gulp Taks
 */

// Lint, minify, and concatenate scripts
gulp.task('build:scripts', ['clean:dist'], function() {
    var jsTasks = lazypipe()
        .pipe(rename, { suffix: '.min' })
        .pipe(uglify)
        .pipe(sourcemaps.write, './')
        .pipe(cachebust.resources.bind(cachebust))
        .pipe(gulp.dest, paths.scripts.output)
        .pipe(livereload);

    return gulp.src(paths.scripts.input)
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(tap(function (file, t) {
            if ( file.isDirectory() ) {
                var name = file.relative + '.js';
                return gulp.src(file.path + '/*.js')
                    .pipe(concat(name))
                    .pipe(jsTasks());
            }
        }))
        .pipe(jsTasks());
});

// Process, lint, and minify Sass files
gulp.task('build:styles', ['clean:dist'], function() {
    return gulp.src(paths.styles.input)
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(sass({
            outputStyle: 'expanded',
            sourceComments: true
        }))
        .pipe(flatten())
        .pipe(prefix({
            browsers: ['last 2 version', '> 1%'],
            cascade: true,
            remove: true
        }))
        //.pipe(gulp.dest(paths.styles.output))
        .pipe(rename({ suffix: '.min' }))
        .pipe(minify({
            discardComments: {
                removeAll: true
            }
        }))
        .pipe(cachebust.resources())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.styles.output))
        .pipe(livereload());
});

// Generate SVG sprites
gulp.task('build:svgs', ['clean:dist'], function () {
    return gulp.src(paths.svgs.input)
        .pipe(plumber())
        .pipe(tap(function (file, t) {
            if ( file.isDirectory() ) {
                var name = file.relative + '.svg';
                return gulp.src(file.path + '/*.svg')
                    .pipe(svgmin())
                    .pipe(svgstore({
                        fileName: name,
                        prefix: 'icon-',
                        inlineSvg: true
                    }))
                    .pipe(gulp.dest(paths.svgs.output));
            }
        }))
        .pipe(svgmin())
        .pipe(gulp.dest(paths.svgs.output));
});

// Copy image files into output folder
gulp.task('build:images', ['clean:dist'], function() {
    return gulp.src(paths.images.input)
        .pipe(plumber())
        .pipe(gulp.dest(paths.images.output));
});

// Lint scripts
gulp.task('lint:scripts', function () {
    return gulp.src(paths.scripts.input)
        .pipe(plumber())
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

// Remove pre-existing content from output and test folders
gulp.task('clean:dist', function () {
    del.sync([
        paths.output
    ]);
});

// Generate documentation
gulp.task('build:docs', ['compile', 'clean:docs'], function() {
    return gulp.src(paths.docs.input)
        .pipe(plumber())
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(tap(function (file, t) {
            if ( /\.md|\.markdown/.test(file.path) ) {
                return t.through(markdown);
            }
        }))
        .pipe(header(fs.readFileSync(paths.docs.templates + '/_header.html', 'utf8')))
        .pipe(footer(fs.readFileSync(paths.docs.templates + '/_footer.html', 'utf8')))
        .pipe(cachebust.references())
        .pipe(gulp.dest(paths.docs.output))
        .pipe(livereload());
});

// Remove prexisting content from docs folder
gulp.task('clean:docs', function () {
    return del.sync(paths.docs.output);
});

// Spin up livereload server and listen for file changes
gulp.task('listen', function () {
    livereload.listen({
        host: 'localhost',
        port: 3000
    });
    gulp.watch(paths.input, ['default']);
});


/**
 * Task Runners
 */

// Compile files
gulp.task('compile', [
    'lint:scripts',
    'clean:dist',
    'build:scripts',
    'build:styles',
    'build:images',
    'build:svgs'
]);

// Generate documentation
gulp.task('docs', [
    'clean:docs',
    'build:docs'
]);

// Compile files and generate docs (default)
gulp.task('default', [
    'compile',
    'docs'
]);

// Compile files and generate docs when something changes
gulp.task('watch', [
    'listen',
    'default'
]);