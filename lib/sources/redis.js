var redis = require('redis');
var fs    = require('fs');

var BufferedReader = require('buffered-reader');


var Redis = module.exports = function(config){
  
  this.host     = config.host;
  this.port     = config.port;
  this.password = config.password;
  this.prefix   = config.prefix || 'sentry';
  //TODO database
  
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
      transaction.sismember(this.prefix + ':category:' + keys[i], parts.join('.'));              
    }
    parts.shift();           
  }
    
  
  transaction.exec(function(err, results){
    callback(results.indexOf(1) > -1);
  });  
};



Redis.prototype.writeDomains = function(name, file_path, options, callback){
  var self = this;
  
  options = options || {};
  
  if(!callback && typeof options == 'function'){
    callback = options;
    options = {};
  }
  
  //start a redis "transation"
  var transaction = this.client.multi();
  
  //read the domains file line by line
  var reader = new BufferedReader(file_path, { encoding: "utf8" });
  
  reader.on('line', function(domain){
    //convert bytes to string
    domain = domain.toString();

    //add to the redis set
    transaction.sadd(self.prefix + ':category:' + name, domain);        
  });
  
  reader.on('error', function(err){
    callback(err);
  });
  
  //file reading done
  reader.on('end', function(){

    //execute transaction
    transaction.exec(function(err){
      if(callback) callback();
      
      //If we need to watch a file
      if(options.watch){
        fs.watchFile(file_path, function (curr, prev) {
          //wait for changes and then delete the current category list
          self.client.del(self.prefix + ':category:' + name, function(){
            //and read domains again...
            fs.unwatchFile(file_path);
            self.writeDomains(name, file_path, options);
          });
        });
      }      
    });
  });

  reader.read();

};


Redis.prototype.clearDomains = function(){
  var self = this;
  
  this.client.keys(this.prefix + ':category:*', function(err, results){
    var transaction = self.client.multi();
    for(var i in results){
      transaction.del(results[i]);
    }
    transaction.exec();
  });
};



Redis.prototype.getRules = function(name, callback){
  var self = this;
  
  //get all the elements in a list (every element is a key with the rule as json encoded string)
  this.client.lrange(this.prefix  + ':rules:' +  name, 0, -1, function(err, elements){

    //start a tranasaction
    var transaction = self.client.multi();

    if(elements.length > 0){
      for(var i in elements){
        transaction.get(elements[i]);
      }

      transaction.exec(function(err, results){
        var tmp = [];
        
        for(var x in results){
          var obj = JSON.parse(results[x]);
          if(obj){
            tmp.push(obj);
          }
        }
        
        callback(tmp);
      });
    }else{
      callback([]);
    }
    
  });  
};


Redis.prototype.listenForChanges = function(name, callback){
  var listenClient = new Redis(this);
  
  listenClient.client.on('message', function(channel, message){
    callback(message);
  });
  listenClient.client.subscribe(name);
};



Redis.prototype.log = function(state, rule, options){
  
  if(options.url) this.client.publish('sentry', options.url);
};