var url = require('url');
var redis = require('redis');
var fakeredis = require('fakeredis');


var RedisHelper = module.exports = function(sentry, config){
  config = config || {in_memory: true};
  
  this.log    = sentry.log.loggers.get('redis');
  this.prefix = config.prefix || 'sentry';
  this.cache  = sentry.cache;
  this.config = config;
    
  if(config.in_memory === true){
    redis = fakeredis;
    this.log.info('Using In-Memory Redis');
  }
  
  this.createClient(config);
    
  this.log.info('Initialized');
};



RedisHelper.prototype.createClient = function(config){
  
  var self     = this;
  var host     = config.host;
  var port     = config.port;
  var password = config.password;
  var database = config.database;
    
  //create the redis client
  this.client = redis.createClient(port, host);
    
  //Just for the logger
  this.client.on('error', function (err) {  
    self.log.error(err.message);
  });
  
  //Just for the logger - isn't called when using fakeredis
  this.client.on('ready', function () {
    self.log.info('Connected');
  });
  
  //authenticate
  if(password){
    this.client.auth(password);
  }
  
  //select database
  if(database){
    this.client.select(database);
  }
  
  if(config.db){
    for(var category in config.db){
      this.client.sadd.apply(this.client, [this.prefix + ':category:' + category , config.db[category]]);
    }
  }
  
};




RedisHelper.prototype.inCategories = function(options, categories, callback){
   
  //get the domain      
  if(!options.domain){
    options.domain = url.parse(options.url).hostname;    
  }
        
  //Remove http or https...
  options.url = options.url.replace(/(.+:\/\/)/, '');
        
  var self = this;
  var items = [options.url];   
               
  if(options.domain){
    var parts = options.domain.split('.');
      
    while(parts.length > 1){
      items.push(parts.join('.'));
      parts.shift();
    }
  }
  
  var cache_category = categories.join(':');

  if(this.cache.exists(['category', cache_category, options.url])){
    this.cache.get(['category', cache_category, options.url], function(value){
      callback(value.length > 0, value);
    });
  }else{
    
    //Check if redis is ready
    if(!this.client.ready){
      callback(false, []);
      return;
    }
        
    this.cache.lock(['category', cache_category, options.url]);
        
    //Search in redis
    var transaction = this.client.multi();
  
    if(!(categories instanceof Array)) categories = [categories];
    if(!(items instanceof Array))      items = [items];
      
    var tmp = [];
    for(var i in items){
      for(var x in categories){   
        transaction.sismember(this.prefix + ':category:' + categories[x], items[i]);  
        tmp.push(categories[x]);
      }
    }
    
  
    transaction.exec(function(err, results){
      if(err){
        self.log.error(err.message);
        callback(false, results);
        return false;
      }
      var matches = [];
      for(var i in results){
        if(results[i] == 1 && matches.indexOf(tmp[i]) == -1){
          matches.push(tmp[i]);
        }
      }
      self.cache.set(['category', cache_category, options.url], matches);
      callback(matches.length > 0, matches);
    });     
  }
};


RedisHelper.prototype.readDomainsFromFile = function(path, name, options, callback){
  
  var fs = require('fs');
  var readline = require('readline');
  var Stream = require('stream');

  var instream = fs.createReadStream(path);
  var outstream = new Stream();
  var rl = readline.createInterface(instream, outstream);

  var self = this;
  var lines = 0;
  
  options = options || {};
  
  if(!callback && typeof options == 'function'){
    callback = options;
    options = {};
  }

  //start a redis transation
  var transaction = this.client.multi();

  rl.on('line', function(line) {
    //Write all 200 entries into redis
    if(lines > 200){
      transaction.exec(function(err){
        if(err) self.log.error(err.message);
      });
      transaction = self.client.multi();
      lines = 0;
    }
    
    if(line){
      lines++;
      //add to the redis set
      transaction.sadd(self.prefix + ':category:' + name, line);
    }    
  });

  rl.on('close', function(err, line) {
    if(lines > 0){
      transaction.exec(function(err){
        if(err) self.log.error(err.message);
        if(callback) callback(err);   
      });
    }else{
      if(callback) callback();
    }
  });
  
  
  if(options.watch){
    fs.watch(path, function(event){
      self.readDomainsFromFile(path, name);
    });
  }
  
};

