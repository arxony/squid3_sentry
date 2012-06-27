var async   = require('async');
var Cache   = require('./cache');

var sharedInstance;

//config: redirect...
var Core = module.exports = function(config){
  sharedInstance = this;
  this.config = config;
  this.cache = config.cache || new Cache(config);
    
  this.addRuleDefinition('category');
  this.addRuleDefinition('filetype');
  this.addRuleDefinition('match');
  this.addRuleDefinition('time');
  this.addRuleDefinition('group');
  this.addRuleDefinition('user');
  this.addRuleDefinition('ou');
};

Core.getSharedInstance = function(){
  return sharedInstance;
};



//callback will be called either without a param (everything is okay) or with a url (redirect)
Core.prototype.isAllowed = function(options, callback){  
  if(!options || !callback){
    throw new Error('options or callback missing!');
  }
    
  async.forEachSeries(this.cache.rules, function(rule, next){
    rule.isAllowed(options, function(result){
     
      //whitelisted
      if(result === true){
        callback(true, rule);
        next('done');
        return;
      }
      
      //Blocked. result = redirect url
      if(result){
        callback(result, rule);
        next('done');
        return;
      }
      
      next();
    });

  }, function(done){
    //Default... allow all! should be changed to deny all...
    if(!done) callback(true);
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
