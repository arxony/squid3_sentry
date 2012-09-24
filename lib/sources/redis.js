var redis = require('redis');
var fs    = require('fs');

var BufferedReader = require('buffered-reader');


var Redis = module.exports = function(config, core){
  
  this.host     = config.host;
  this.port     = config.port;
  this.password = config.password;
  this.prefix   = config.prefix || 'sentry';
  //TODO select database
  
  this.core = core;
  this.connection_problem = false;

  this.open();
  
  if(!this.core){
    this.core = {
      log:{
        error: console.log
      }
    };
  }
  
};

//Open the connection
Redis.prototype.open = function(){
  var self = this;

  //create the ladp client
  this.client = redis.createClient(this.port, this.host);
  
  this.client.on("error", function (err) {    
    self.core.log.error({error:err, source:'Redis onError'});
    
    if(err.toString().match(/ECONNREFUSED/)){
      self.connection_problem = true;
    }
  });
  
  this.client.on("connect", function () {
    self.connection_problem = false;
  });
  
  //authenticate
  if(this.password){
    this.client.auth(this.password);
  }

};


//Close the connection
Redis.prototype.close = function(){
  this.client.end();
};


Redis.prototype.listContainsItems = function(lists, items, callback){
  
  var self = this;  
  var transaction = this.client.multi();
  
  if(!(lists instanceof Array)) lists = [lists];
  if(!(items instanceof Array)) items = [items];
  
  if(this.connection_problem){
    if(callback) callback(false);
    this.core.log.error({error:'No search possible', source:'Redis listContainsItems'});
    return;
  }
    
  for(var i in items){
    for(var x in lists){            
      transaction.sismember(this.prefix + ':category:' + lists[x], items[i]);              
    }
  }
    
  
  transaction.exec(function(err, results){
    if(err) self.core.log.error({error:err, source:'Redis listContainsItems'});
    callback(results.indexOf(1) > -1, results);
  });  
};



Redis.prototype.writeDomains = function(name, file_path, options, callback){

  var self = this;
  var domains = 0;
  
  options = options || {};
  
  if(!callback && typeof options == 'function'){
    callback = options;
    options = {};
  }
  
  if(this.connection_problem){
    if(callback) callback();
    this.core.log.error({error:'No write possible', source:'Redis writeDomains'});
    return;
  }
  
  
  //start a redis "transation"
  var transaction = this.client.multi();
  
  
  //read the domains file line by line
  var reader = new BufferedReader(file_path, { encoding: "utf8" });
  
  reader.on('line', function(domain){
    //convert bytes to string
    domain = domain.toString();
    
    //Write all 200 entries into redis
    if(domains > 200){
      transaction.exec(function(err){
        if(err) self.core.log.error({error:err, source:'Redis writeDomains'});
      });
      transaction = self.client.multi();
      domains = 0;
    }

    //add to the redis set
    domains++;
    transaction.sadd(self.prefix + ':category:' + name, domain);
    
  });
  
  reader.on('error', function(err){
    callback(err);
  });
  
  //file reading done
  reader.on('end', function(){
    //execute transaction
    if(domains > 0){
      transaction.exec(function(err){
        if(err) self.core.log.error({error:err, source:'Redis writeDomains'});
        if(callback) callback();

        //If we need to watch a file
        if(options.watch){
          fs.watchFile(file_path, function (curr, prev) {
            //wait for changes and then delete the current category list
            self.client.del(self.prefix + ':category:' + name, function(){
              //and read domains again...
              fs.unwatchFile(file_path);
              self.writeDomains(name, file_path, options);
              self.core.purge('redis_cache');
            });
          });
        }      
      });
    }else{
      if(callback) callback();
    }    
  });

  reader.read();

};


Redis.prototype.clearDomains = function(){
  var self = this;
  
  if(this.connection_problem){
    this.core.log.error({error:'No clear possible', source:'Redis clearDomains'});
    return;
  }
  
  this.client.keys(this.prefix + ':category:*', function(err, results){
    if(err) self.core.log.error({error:err, source:'Redis clearDomains'});
    var transaction = self.client.multi();
    for(var i in results){
      transaction.del(results[i]);
    }
    transaction.exec(function(err){
      if(err) self.core.log.error({error:err, source:'Redis clearDomains'});
    });
  });
};



Redis.prototype.getRules = function(name, callback){

  var self = this;
  
  if(this.connection_problem){
    if(callback) callback([]);
    this.core.log.error({error:'No rules read possible', source:'Redis getRules'});
    return;
  }
  
  //get all the elements in a list (every element is a key with the rule as json encoded string)
  this.client.lrange(this.prefix  + ':rules:' +  name, 0, -1, function(err, elements){
    
    if(err) self.core.log.error({error:err, source:'Redis getRules'});

    //start a tranasaction
    var transaction = self.client.multi();
    
    if(elements && elements.length > 0){
      for(var i in elements){
        transaction.get(elements[i]);
      }

      transaction.exec(function(err, results){
        if(err) self.core.log.error({error:err, source:'Redis getRules'});
        
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
  var listenClient = new Redis(this, this.core);
  
  listenClient.client.on('message', function(channel, message){
    callback(message);
  });
  listenClient.client.subscribe(name);
};
