var Core = require('./core');
var url  = require('url');

exports.start = function(config){
  var self = this;  
    
  //create a new Core instance of none is given.
  this.core = Core.getSharedInstance() || new Core(config);
    
  //listen to stdin and set the encoding to utf8
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  //when squid quits the stdin, exit the app as well!
  process.stdin.on('end', function () {
    process.exit(0);
  });
  
  //on data (see http://wiki.squid-cache.org/Features/Redirectors)
  process.stdin.on('data', function (chunk) {
    self.parse(chunk, function(output){
      //write the result to stdout.
      process.stdout.write(output + '\n');
    });
  });
  
};


exports.parse = function(chunk, callback){
  var self   = this;
  var chunks = chunk.split(' ');
  
  if(chunk.length > 3){
    var params = {
      id:       chunks[0],
      url:      chunks[1],
      ip:       chunks[2],
      username: chunks[3],
      method:   chunks[4],
      domain:   url.parse(chunks[1]).hostname
    };

    this.core.isAllowed(params, function(result, rule){
      var tmp = params.id;

      if(typeof result == 'string'){
        if(!result.match(/http(s|):\/\//)) result = 'http://' + result;
        tmp += ' ' + (rule.mode == 'redirect' ? '301:' : '') + result;
      }

      callback(tmp);
    });
  }  
};