var gulp = require('gulp');
var exec = require('child_process').exec;

module.exports = function(source, destination) {
gulp.task('compileCSS', function() {
	// compile LESS (http://lesscss.org)
  exec('lessc --strict-math=on '+source+' '+destination, function (error) {
    if (error !== null) {
      console.log('exec error: ' + error);
    } else {
    	console.log(source+' compiled to '+destination+'');
    }
  });
  // autoprefix (http://github.com/postcss/autoprefixer)
  exec('autoprefixer '+destination, function(error) {
  	if (error !== null) {
      console.log('exec error: ' + error);
    } else {
    	console.log(destination+' autoprefixed');
    }
  });
});

gulp.watch('*.less', ['compileCSS']);

return 'compileCSS';
}