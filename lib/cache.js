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
  
  this.redirect = config.redirect;
  
  if(config.ldap){
    this.setLdapConf(config.ldap);
  }
  
  this.setRedisConf(config.redis || {});
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
    this.redis.listenForChanges('sentry', function(msg){
      console.log('CHANGE:', msg);
    });
  }
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
