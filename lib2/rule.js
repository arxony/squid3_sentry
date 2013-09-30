var async = require('async');


/** RULE CONFIG
 *
 * name: (String) name of the rule, for debugging. Default: rule[nr]
 * allowed: (Boolean) whitelisting or blacklisting a match. Default: false
 * redirect: (String) url to redirect if it's not allowed. Default: [see core config]
 * categories: (Array) Strings of category names. Optional
 * matches: (Array) Wildcard matches for a url/domain (e.g. ['*.domain.com', 'domain.com']). Optional
 * file_types: (Array) filetype endings (e.g. ['swf', 'flv']). Optional
 * times: (Array) Objects with time definitions (e.g. [{day:2, from:'00:00', to:'17:00'}]). Optional
 * groups: (Array) Groups LDAP paths (e.g. ['CN=Group1,CN=Users,DC=domain,DC=lan']). Optional
 * users: (Array) Users LDAP paths (e.g. ['CN=User1,CN=Users,DC=domain,DC=lan']). Optional
 * ous: (Array) OUs LDAP paths (e.g. ['OU=Special Users,CN=Users,DC=domain,DC=lan']). Optional
 * ...
 *
 **/

  
var Rule = module.exports = function(rules, options){
  
  this.name         = options.name || 'rule' + rules.items.length;
  this.allowed      = options.allowed || false;
  this.redirect     = options.redirect || rules.redirect;

  // Every rule type that needs to be asked is in that list (e.g. category, match, group)
  this.types = [];
    
  this.log = rules.log;
  
  for(var i in rules.types){
    var type = new rules.types[i](rules.sentry, this);
    
    if(type.isUsed(options)){
      this.types.push(type);
    }
  }

  this.buildCallbackList();
  
};

Rule.prototype.isAllowed = function(options, callback){
  var self = this;
  
  if(this.types.length > 0){
    
    async.parallel(this.callback_list(options), function(err, results){
      if(err){
        //if there was an error == some type did not match
        callback(null);
      }else{
        self.log.debug('%s matches', self.name, options);
        callback(self.allowed, self.redirect);
      }
    });
  }else{
    //if there are no matches defined - it matches!
    callback(this.allowed, this.redirect);
  }
};


Rule.prototype.buildCallbackList = function(){
  
  var self  = this;
  var tmp = [];

  for(var i in this.types){
    (function(type){
      if(typeof type.filter == 'function'){
        tmp.push(function(callback){
          type.filter(self.current_options, callback);
        });
      }
    })(this.types[i]);
  }
  
  
  this.callback_list = function(options){
    self.current_options = options;    
    return tmp;
  };
  
};
