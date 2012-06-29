var Rule  = require('./rule');
var Ldap  = require('./sources/ldap');
var Redis = require('./sources/redis');

var Cache = module.exports = function(config){
  this.rules = [];
  this.rule_configs = [];
  this.rule_types = {
    dest:{},
    src:{},
    misc:{}
  };
  
  this.name         = config.name || 'sentry';
  this.redis_rules  = config.redis_rules;
  this.redirect     = config.redirect;
  this.config       = config;
  
  if(config.ldap){
    this.setLdapConf(config.ldap);
  }
  
  if(config.redis){
    this.setRedisConf(config.redis);
  }
  
  if(config.rules){
    if(!(config.rules instanceof Array)) config.rules = [config.rules];
    
    for(var i in config.rules){
      this.addRule(config.rules[i]);
    }
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
    
    
    if(config.rules){
      var self = this;
      
      this.reloadRedisRules();
      this.redis.listenForChanges(this.name, function(msg){

        if(msg == 'reload'){
          self.reloadRedisRules();
        }

      });
    }
    
  }
};

Cache.prototype.reloadRedisRules = function(){
  var self = this;

  this.redis.getRules(this.name, function(rules){
    var tmp = [];

    for(var i in rules){
      tmp.push(new Rule(rules[i], self));
    }
    
    delete self.rules;
    self.rules = tmp;

  });
};


Cache.prototype.setLdapConf = function(config){
  if(!this.ldap){ 
    this.ldap = new Ldap(config);
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
