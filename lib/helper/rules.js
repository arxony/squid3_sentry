
var url   = require('url');
var async = require('async');

var Rule = require('../rule');

/**
 * The `Rules` Object
 */
var Rules = module.exports = function(sentry, config){
  config = config || {};
    

  this.sentry = sentry;
  this.log = sentry.log.loggers.get('rules');
  
  //Array of active rule Objects
  this.items = [];
  
  //init vars
  this.timeout  = config.timeout  || 1000;
  this.redirect = config.redirect || false;
  this.requests = 0;
  
  //require all rule types if not provided via the config
  this.types = config.rule_types || {
    category_file:  require('../types/category_file'),
    category:       require('../types/category'),
    file_type:      require('../types/file_type'),
    group:          require('../types/group'),
    ip:             require('../types/ip'),
    match:          require('../types/match'),
    ou:             require('../types/ou'),
    time:           require('../types/time'),
    user:           require('../types/user')
  };
  
  var tmp = config.items || config;
  if(tmp instanceof Array){
    for(var i = 0; i < tmp.length; i++){
      this.add(tmp[i]);
    }
  }
  
  this.log.info('Initialized');
};


/**
 *
 * @param {Object} options
 * @return {Function} callback
 * @api public
 */
Rules.prototype.isAllowed = function(options, callback){
  if(!options || !callback){
    throw new Error('Options and/or callback missing');
  }
      
  var self = this;
  
  if(this.requests >= Number.MAX_VALUE){
    this.requests = 0;
  }
  this.requests++;

  //add exta params
  options.url = options.url || '';
  options.domain = url.parse(options.url).hostname;
  options.matches = {};
  
  self.log.request(this.requests, options);  
  
  //add request number
  options.request = this.requests; 
  
  if(this.items.length === 0){
    callback(true);
    return;
  }    
      
  //Sentry immediately returns true (allow) but will continue to check it's rules. Use the debugger to see what will happen.
  if(this.dry_run){ //TODO
    callback(true);
    callback = function(){};
  }
  
  
  //If it takes to long to serve a request, the request will be allowed!
  var timed_out = false;
  var timeout_timer = setTimeout(function(){
    timed_out = true;
    callback(true);    
    self.log.error('%d TIMEOUT', options.request, options);     
  }, this.timeout);
  
  
  //iterate over all rules
  async.forEachSeries(this.items, function(rule, next){
    rule.isAllowed(options, function(result, redirect){
      
      if(timed_out){
        next('timeout');
        return false;
      }
      
      //whitelisted
      if(result === true){
        //Clear timeout
        clearTimeout(timeout_timer);
        
        callback(true, rule);
        
        self.log.allow(options.request);
        
        next('allow');
        return;
      }
      
      //Blocked
      if(result === false){
        //Clear timeout
        clearTimeout(timeout_timer);
        
        //replace placeholder (e.g. [domain]) with actual values
        if(redirect){
          redirect = redirect.replace(/\[(.+?)\]/ig, function(a, field){
            if(options[field]) return encodeURI(options[field]);
            if(options.matches[field]) return encodeURI(options.matches[field]);
            if(rule[field]) return encodeURI(rule[field]);          
            return '';          
          });
          
          if(!redirect.match(/http(s|):\/\//)) redirect = 'http://' + redirect;
        }
        
        callback(false, rule, redirect);

        options.rule = rule.name;
        options.redirect = redirect;

        self.log.deny(options.request);        
        
        next('deny');
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
      self.log.no_match(options.request);
    }
  });
};


Rules.prototype.add = function(config, position){
  if(typeof position == 'number'){    
    this.items.splice(position, 0, new Rule(this, config));
  }else{
    this.items.push(new Rule(this, config));
  }
};


Rules.prototype.remove = function(position){
  this.items.splice(position, 1);
};


Rules.prototype.removeAll = function(){
  this.items = [];
};