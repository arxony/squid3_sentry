var async   = require('async');
var Cache   = require('./cache');

var sharedInstance;

//config: redirect...
var Core = module.exports = function(config){
  sharedInstance = this;
  this.config = config;
  this.cache = config.cache || new Cache(config);
   
  this.addRuleDefinition('domain_file'); 
  this.addRuleDefinition('category');
  this.addRuleDefinition('filetype');
  this.addRuleDefinition('match');
  this.addRuleDefinition('time');
  this.addRuleDefinition('group');
  this.addRuleDefinition('user');
  this.addRuleDefinition('ou');
  
  this.cache.loadRules(config.rules, 'config');
};

Core.getSharedInstance = function(){
  return sharedInstance;
};



//callback will be called either without a param (everything is okay) or with a url (redirect)
Core.prototype.isAllowed = function(options, callback){  
  if(!options || !callback){
    throw new Error('options or callback missing!');
  }
   
  var self = this;
  
  async.forEachSeries(this.cache.rules, function(rule, next){
    rule.isAllowed(options, function(result){
     
      //whitelisted
      if(result === true){
        callback(true, rule);
        self.log(true, rule, options);
        
        next('done');
        return;
      }
      
      //Blocked. result = redirect url
      if(result){
        //replace placeholder (e.g. [domain]) with actual values
        var redirect = result.replace(/\[(.+?)\]/ig, function(a, field){
          if(options[field]) return options[field];
          if(rule[field]) return rule[field];
          return '';          
        });
        
        callback(redirect, rule);
        self.log(redirect, rule, options);
        
        next('done');
        return;
      }
      
      next();
    });

  }, function(done){
    //Default... allow all! should be changed to deny all...
    if(!done){
      callback(true);
      self.log(null, null, options);
    }
  });
};



Core.prototype.addRule = function(rule, position){
  this.cache.addRule(rule, position);
};

Core.prototype.addRuleDefinition = function(ruledef){
  if(typeof ruledef == 'string'){
    //TODO check if exists. allow '*'
    this.cache.addRuleDefinition(require('./rules/' + ruledef));
  }else{
    this.cache.addRuleDefinition(ruledef);
  }
};


Core.prototype.log = function(state, rule, options){
  if(this.config.explain){
    switch(typeof state){
      case 'string':
        console.log((rule.mode == 'redirect' ? '[REDIRECT]' : '[REWRITE] '), options.domain, 'to', state, 'denied by rule', rule.name);
      break;
      
      case 'boolean':
        console.log('[ALLOWED] ', options.domain, 'allowed by rule', rule.name);
      break;
      
      default:
      console.log('[DEFAULT] ', options.domain, 'allowed');
    }
  }
};
