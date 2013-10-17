var util = require('util');
var icap = require('icap');
var fs   = require('fs');

var Mustache = require('mustache');
var Provider = require('./provider');

var Icap = module.exports = function(config){
  Provider.call(this, config);
  
  this.port = config.port || 1344;
  
  
  var content = 'Access denied';

  if(typeof config.template == 'string'){
    if(fs.existsSync(config.template)){
      try{
        content = fs.readFileSync(config.template).toString();
      }catch(e){
        content = 'Template loading failed!';
      }
    }
  }
    
  this.template = Mustache.compile(content);
  
  
};

util.inherits(Icap, Provider);

Icap.prototype.start = function(){
  var self = this;
  
  var server = icap.createServer(function(req, res, next){
    
    var params = {
      url:      req.url,
      ip:       req.icap.headers['x-client-ip'],
      username: decodeURI(req.icap.headers['x-client-username']).replace(/@.+$/, ''),
      method:   req.method
    };
    
    if(!params.url.match(/^http:.+/) && params.method == 'CONNECT'){
      params.url = 'https://' + params.url;
    }
        
    self.isAllowed(params, function(result, rule, redirect){    
        if(result){  
          next();
        }else{
          if(typeof redirect == 'string'){
            res.writeHead(301, {Location: redirect});
            res.end();
          }else{
            if(self.template){
              res.end( self.template(rule) );
            }
          }
        }
      });
  });

  server.listen(this.port);
  return server;
};
