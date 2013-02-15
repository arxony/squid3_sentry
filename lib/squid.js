var Core = require('./core');

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
  var chunks = chunk.match(/(\d+) (.+?) (.+?)\/- (.+?) (.+?)( (.+)|$)/);
  
  if(chunks){
        
    var params = {
      id:       chunks[1],
      url:      chunks[2],
      ip:       chunks[3],
      username: decodeURI(chunks[4]),
      method:   chunks[5],
      params:   chunks[7]
    };
    
    if(!params.url.match(/^http:.+/) && params.method == 'CONNECT'){
      params.url = 'https://' + params.url;
    }
    
    this.core.isAllowed(params, function(result, rule){
      var tmp = params.id;

      if(typeof result == 'string'){
        var status = '302';
        
        if(params.url.match(/^https.+/)){
          status = '403';
        }
        
        if(!result.match(/http(s|):\/\//)) result = 'http://' + result;
        tmp += ' ' + (rule.mode == 'redirect' ? status + ':' : '') + result;
      }

      callback(tmp);
    });
  }else{
    if(chunk.length > 1){
      self.core.log.error({error:'Can\'t parse input', source:'squid parse', input: chunk});
      callback(chunk.split(' ')[0]);
    }
    
  }  
};