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
    var parts = [chunk];
    
    if(chunk.match(/\n/)){
      parts = chunk.split(/\n/);
    }
    
    for(var i in parts){
      self.parse(parts[i], function(output){
        //write the result to stdout.
        process.stdout.write(output + '\n');
      });
    }
    
  });
  
};


exports.parse = function(chunk, callback){
  var self   = this;
  //var chunks = chunk.split(' ');
  var chunks = chunk.match(/(\d+) (http.+) (.+?) (.+?) (.+?)( .*|)/);
  
  if(chunks){
    var params = {
      id:       chunks[1],
      url:      chunks[2],
      ip:       chunks[3],
      username: chunks[4],
      method:   chunks[5],
      domain:   url.parse(chunks[2]).hostname
    };
    
    this.core.isAllowed(params, function(result, rule){
      var tmp = params.id;

      if(typeof result == 'string'){
        if(!result.match(/http(s|):\/\//)) result = 'http://' + result;
        tmp += ' ' + (rule.mode == 'redirect' ? '302:' : '') + result;
      }

      callback(tmp);
    });
  }else{
    callback('');
  }  
};