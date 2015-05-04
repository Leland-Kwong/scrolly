var gulp = require('gulp');
var compileCSS = require('./gulp.compileCSS.js');

gulp.task('default', [compileCSS('demo.less', 'demo.css')])