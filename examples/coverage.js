var Mocha = require('mocha');
var glob  = require('glob');
var blanket = require('blanket')({
  pattern: 'lib',
  'data-cover-never': ['test', 'node_modules']
});

               
var Reporter = function(runner){
  var self = this;
  Mocha.reporters.JSONCov.call(this, runner, false);

  runner.on('end', function(){
    for(var i in self.cov.files){
      var file = self.cov.files[i];
      var dir = __dirname.replace('/examples', '');
      //if(!file.match(/node_modules/)){
        console.log(Math.round(file.coverage) + '% in', file.filename.replace(dir, ''));
        //}
    }
    console.log(Math.round(self.cov.coverage) + '%', 'coverage');
  });
}
  
    
var mocha = new Mocha({
  recursive: true,
  reporter: Reporter
});

glob('./test/**/*-test.js', function (err, files) {
  
  files.unshift('./test/_globals.js');
  
  for(var i in files){
    mocha.addFile(files[i]);
  }
  
  var reporter = mocha.run(function(){
    process.exit(0);
  });
});