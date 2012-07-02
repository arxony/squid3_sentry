var Rule  = require('./rule');
var Ldap  = require('./sources/ldap');
var Redis = require('./sources/redis');

var Cache = module.exports = function(config){
  this.rules = [];
  this.rules_cache = {};
  this.rule_configs = [];
  this.rule_types = {
    dest:{},
    src:{},
    misc:{}
  };
  this.purge_callbacks = [];
  
  this.name         = config.name || 'sentry';
  this.config       = config;
  this.redirect     = config.redirect;
  this.rule_sources = config.rule_sources || ['config'];
  
  
  if(config.ldap){
    this.setLdapConf(config.ldap);
  }
  
  if(config.redis){
    this.setRedisConf(config.redis);
  }
    
};

Cache.prototype.addRule = function(rule, position){
  if(typeof position == 'number'){    
    this.rules.splice(position, 0, new Rule(rule, this));
  }else{
    this.rules.push(new Rule(rule, this));
  }  
};

Cache.prototype.addRuleDefinition = function(ruledef){
  //Rule definitions for specific type (dest, src, misc)
  if(this.rule_types[ruledef.type] != null && typeof ruledef.filter == 'function'){
    this.rule_types[ruledef.type][ruledef.name] = ruledef.filter;
  }

  //Rule option parsing
  if(typeof ruledef.config == 'function'){
    this.rule_configs.push(ruledef.config);
  }
  
  //Cache class extentions
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


Cache.prototype.setRedisConf = function(config){
  if(!this.redis){
    this.redis = new Redis(config);
    
    var self = this;
      
    this.reloadRedisRules();
    this.redis.listenForChanges(this.name, function(msg){

      if(msg == 'reload'){
        self.reloadRedisRules();
      }

    });
    
    
  }
};


Cache.prototype.loadRules = function(rules, source){
  
  if(rules && rules instanceof Array){
    var pos = this.rule_sources.indexOf(source);

    if(pos != -1){
      this.rules_cache[source] = [];

      for(var i in rules){
        this.rules_cache[source].push(new Rule(rules[i], this));
      }

      var tmp = [];
      for(i in this.rule_sources){
        tmp = tmp.concat(this.rules_cache[this.rule_sources[i]]);
      }
      this.rules = tmp;
      
    }
  }
  
};


Cache.prototype.reloadRedisRules = function(){
  var self = this;

  this.redis.getRules(this.name, function(rules){
    self.loadRules(rules, 'redis');
    self.purge();
  });
};


Cache.prototype.setLdapConf = function(config){
  if(!this.ldap){ 
    this.ldap = new Ldap(config);
  } 
};



Cache.prototype.purge = function(){
  for(var i in this.purge_callbacks){
    this.purge_callbacks[i].call(this);
  }
};


Cache.prototype.close = function(){
  if(this.ldap){
    this.ldap.close();
  }
  
  if(this.redis){
    this.redis.close();
  }
};
