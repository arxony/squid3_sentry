var async   = require('async');
var bunyan  = require('bunyan');
var url  = require('url');


var Rule  = require('./rule');
var Ldap  = require('./sources/ldap');
var Redis = require('./sources/redis');

var sharedInstance;


//config: redirect...
var Core = module.exports = function(config){
  sharedInstance = this;
  
  this.config = config || {};

  this.rules = [];
  this.rules_cache = {};
  this.rule_configs = [];
  this.rule_types = {};
  this.purge_callbacks = [];
  this.loaded_rule_sources = [];
  
  this.name           = this.config.name || 'sentry';
  this.mode           = this.config.mode || 'redirect';
  this.redirect       = this.config.redirect;
  this.cache_time     = this.config.cache_time;
  this.rule_sources   = this.config.rule_sources || ['config'];
  this.ignore_test    = this.config.ignore_test;  //to ignore test commands via redis. will be used only by the status script
  this.measure_times  = this.config.measure_times || false;
  this.dry_run        = this.config.dry_run || false;
  this.timeout        = this.config.timeout || 2000;
  
  
  this.createLogger();
    
  this.log.info('Sentry started');
  
  //global exception handling!
  var self = this;
  process.on('uncaughtException', function(err){
    self.log.error({error:err, stack:err.stack, source:'uncaughtException'});
  });
  
  
  if(config.ldap){
    this.setLdapConf(config.ldap);
  }
  
  if(config.redis){
    this.setRedisConf(config.redis);
  }
   
  this.addRuleDefinition('category_file');
  this.addRuleDefinition('file_type'); 
  this.addRuleDefinition('category');
  this.addRuleDefinition('match');
  this.addRuleDefinition('time');
  this.addRuleDefinition('group');
  this.addRuleDefinition('user');
  this.addRuleDefinition('ou');
  this.addRuleDefinition('ip');
  
  this.loadRules(this.config.rules, 'config');
  
  if(this.cache_time){
    this.startPeriodicalPurge();
  }
    
};

Core.getSharedInstance = function(){
  return sharedInstance;
};





//create a bunyan logger
Core.prototype.createLogger = function(){
  
  this.log_serializers = {
    rule: function(rule){
      return typeof rule == 'object' ? rule.name : rule;
    },
    rules: function(rules){
      var tmp = [];
      for(var i in rules){
        tmp.push(rules[i].name);
      }
      return tmp;
    },
    error: function(err){
      if(typeof err != 'string') err = err.toString();
      return err;
    }
  };
  
  var logger_conf = {
    name: this.name,
    serializers: this.log_serializers
  };
  if(this.config.explain !== true && typeof this.config.log == 'string'){
    logger_conf.streams = [{
      level: this.config.log_level || 'error',
      path: this.config.log
    }];
  }
  
  if(this.config.log === false){
    logger_conf.streams = []; //Do not log anything
  }
  
  //create a new bunyan logger
  this.log = bunyan.createLogger(logger_conf);
};



// *******RULES******

Core.prototype.addRule = function(rule, position){
  if(typeof position == 'number'){    
    this.rules.splice(position, 0, new Rule(rule, this));
  }else{
    this.rules.push(new Rule(rule, this));
  }  
};

Core.prototype.addRuleDefinition = function(ruledef){
  if(typeof ruledef == 'string'){
    //TODO check if exists. allow '*'
    ruledef = require('./rules/' + ruledef);
  }
  
  //Rule definitions for specific type (dest, src, misc)
  if(typeof ruledef.filter == 'function'){
    this.rule_types[ruledef.name] = ruledef.filter;
  }

  //Rule option parsing
  if(typeof ruledef.config == 'function'){
    this.rule_configs.push(ruledef.config);
  }
  
  //class extentions
  if(typeof ruledef.cache == 'object'){
    
    if(typeof ruledef.cache.purge == 'function'){
      this.purge_callbacks.push(ruledef.cache.purge);
    }
    
    for(var i in ruledef.cache){
      if(!this[i]){
        this[i] = ruledef.cache[i];
      }
    }
  }
};


// *******REDIS RULES******

Core.prototype.loadRules = function(rules, source){
  
  if(rules && rules instanceof Array){
    var pos = this.rule_sources.indexOf(source);

    if(pos != -1){
      this.rules_cache[source] = [];
      if(this.loaded_rule_sources.indexOf(source) == -1) this.loaded_rule_sources.push(source);

      for(var i in rules){
        this.rules_cache[source].push(new Rule(rules[i], this));
      }

      var tmp = [];
      for(i in this.rule_sources){
        var rule = this.rules_cache[this.rule_sources[i]];
        if(rule) tmp = tmp.concat(rule);
      }
      this.rules = tmp;
      
      this.log.info({rules:this.rules, loaded_sources: this.loaded_rule_sources});
    }
  }
  
};


Core.prototype.reloadRedisRules = function(purge){
  var self = this;

  this.redis.getRules(this.name, function(rules){
    self.loadRules(rules, 'redis');
    if(purge) self.purge();
  });
};


// *******SOURCES******

Core.prototype.setRedisConf = function(config){
  if(!this.redis){
    var self = this;
    
    this.redis = new Redis(config, this);
      
    this.redis.onReady(function(){

      self.reloadRedisRules();
      self.redis.listenForChanges(self.name, function(msg){
      
        switch(msg){
          case 'test':
            if(self.ignore_test !== true) self.redis.client.publish(self.name, 'test:ok');
          break;
        
          case 'reload':
            self.log.info('Reload Rules');
            self.reloadRedisRules(true);
          break;
        
          case 'start debugger':
            self.tmp_log = self.log;
            self.log = bunyan.createLogger({
              name: self.name,
              src: true,            
              serializers: self.log_serializers,
              streams: [{
                path: self.config.log
              }]
            });
            self.log.info('Debugger started!');
          break;
        
          case 'stop debugger':
            if(self.tmp_log){
              self.log.info('Debugger stopped!');
              delete self.log;
              self.log = self.tmp_log;
            }
          break;
        
          case 'purge':
            self.purge();
          break;
        
          default:
            self.log.error({error:'Command "' + msg + '" not found!', source: 'core setRedisConf'});
        }

      });
      
    });    
    
  }
};


Core.prototype.setLdapConf = function(config){
  if(!this.ldap){ 
    var self = this;
    
    this.ldap = new Ldap(config, this);
  } 
};


// *******CLEAR CACHE******

Core.prototype.purge = function(){
  this.log.info('Purge Cache');
  for(var i in this.purge_callbacks){
    this.purge_callbacks[i].call(this);
  }
};

Core.prototype.startPeriodicalPurge = function(){
  var self = this;
  setInterval(function(){
    self.purge();
  }, this.cache_time);
};


Core.prototype.close = function(){
  if(this.ldap){
    this.ldap.close();
  }
  
  if(this.redis){
    this.redis.close();
  }
  
  this.log.info('Sentry stopped!');
};



// *******MAIN******

//callback will be called either without a param (everything is okay) or with a url (redirect)
Core.prototype.isAllowed = function(options, callback){  
  if(!options || !callback){
    throw new Error('options or callback missing!');
  }
    
  //add more...
  options.domain = url.parse(options.url).hostname;
    
  var self = this;
  
  //Sentry immediately returns true (allow) but will continue to check it's rules. Use the debugger to see what will happen.
  if(self.dry_run){
    callback(true);
    callback = function(){};
  }
  
  self.log.info({
    type: 'REQUEST',
    options:options
  });
  
  if(self.measure_times){
    options.start_time = new Date();
  }
  
  //If it takes to long to serve a request, the request will be allowed!
  var timed_out = false;
  var timeout_timer = setTimeout(function(){
    timed_out = true;
    callback(true);    
    self.log.error({error:'Request Timeout!', source: 'core isAllowed', request: options});     
  }, self.timeout);
  
  
  async.forEachSeries(this.rules, function(rule, next){
    rule.isAllowed(options, function(result){
      
      if(timed_out){
        next('stop');
        return false;
      }
      
      //whitelisted
      if(result === true){
        //Clear timeout
        clearTimeout(timeout_timer);
        
        callback(true, rule);
        
        self.log.info({
          allowed:true,
          rule:rule,
          options:options
        });
        
        next('done');
        return;
      }
      
      //Blocked. result = redirect url
      if(result){
        //Clear timeout
        clearTimeout(timeout_timer);
        
        //replace placeholder (e.g. [domain]) with actual values
        var redirect = result.replace(/\[(.+?)\]/ig, function(a, field){
          if(options[field]) return options[field];
          if(rule[field]) return rule[field];
          return '';          
        });
        
        callback(redirect, rule);

        self.log.info({
          allowed:false,
          redirect:redirect,
          rule:rule,
          options:options,
          used_time: self.measure_times ? (new Date() - options.start_time) : null
        });        
        
        next('done');
        return;
      }
      
      next();
    });

  }, function(done){
    //Default... allow all! should be changed to deny all...?
    if(!done){
      //Clear timeout
      clearTimeout(timeout_timer);
      
      callback(true);
      self.log.info({
        allowed: true,
        rule: 'DEFAULT',
        options:options,
        used_time: self.measure_times ? (new Date() - options.start_time) : null
      });
    }
  });
};

