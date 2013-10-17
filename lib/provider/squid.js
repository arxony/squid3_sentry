var util = require('util');
var Provider = require('./provider');

var Squid = module.exports = function(config){
  Provider.call(this, config);
};

util.inherits(Squid, Provider);

Squid.prototype.start = function(){
  var self = this;  
    
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


Squid.prototype.parse = function(chunk, callback){
  var chunks = chunk.match(/(\d+) (.+?) (.+?)\/- (.+?) (.+?)( (.+)|$)/);
  
  if(chunks){
        
    var params = {
      id:       chunks[1],
      url:      chunks[2],
      ip:       chunks[3],
      username: decodeURI(chunks[4]).replace(/@.+$/, ''),
      method:   chunks[5],
      params:   chunks[7]
    };
    
    if(!params.url.match(/^http:.+/) && params.method == 'CONNECT'){
      params.url = 'https://' + params.url;
    }
    
    this.isAllowed(params, function(result, rule, redirect){
      var tmp = params.id;

      if(!result){
        var status = '302';
        
        if(params.url.match(/^https.+/)){
          status = '403';
        }
                
        tmp += ' ' + (rule.mode == 'redirect' ? status + ':' : '') + redirect;
      }

      callback(tmp);
    });
  }else{
    if(chunk.length > 1){
      this.sentry.log.error('Can\'t parse input', chunk);
      callback(chunk.split(' ')[0]);
    } 
  }  
};