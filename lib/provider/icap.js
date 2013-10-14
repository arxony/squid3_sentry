var util = require('util');
var icap = require('icap');
var Provider = require('./provider');

var Icap = module.exports = function(config){
  Provider.call(this, config);
  
  this.port = config.port || 1344;
  
};

util.inherits(Icap, Provider);

Icap.prototype.start = function(){
  var self = this;
  
  var server = icap.createServer(function(req, res, next){
    console.log(req);
    self.isAllowed({url: req.url, username: req.headers['X-Client-Username']}, function(result, rule, redirect){    
        if(typeof result == 'string'){
      
          res.end('access denied because of ' + rule.name + '. Redirect to ' + redirect);
        }else{      
          next();
        }
      });
  });

  server.listen(this.port);
  return server;
};
