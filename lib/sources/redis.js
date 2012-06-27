var redis = require('redis');

var Redis = module.exports = function(config){
  
  this.host     = config.host;
  this.port     = config.port;
  this.password = config.password;
  
  this.open();
  
};

//Open the connection
Redis.prototype.open = function(){
  //create the ladp client
  this.client = redis.createClient(this.port, this.host);

  //authenticate
  if(this.password){
    this.client.auth(this.password);
  }
  
};


//Close the connection
Redis.prototype.close = function(){
  this.client.end();
};


Redis.prototype.containsDomain = function(keys, domain, callback){
  var transaction = this.client.multi();
    
  var parts = domain.split('.');
  while(parts.length > 1){
    for(var i in keys){            
      transaction.sismember(keys[i], parts.join('.'));              
    }
    parts.shift();           
  }
    
  
  transaction.exec(function(err, results){
    callback(results.indexOf(1) > -1);
  });  
};


Redis.prototype.getRules = function(name, callback){
  this.client.lrange(name, 0, -1, function(elements){
    
  })
  this.client.hgetall()
};


Redis.prototype.listenForChanges = function(name, callback){
  var listenClient = new Redis(this);
  
  listenClient.client.on('message', function(channel, message){
    callback(message);
  });
  listenClient.client.subscribe(name);
};