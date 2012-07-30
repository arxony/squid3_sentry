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

  
var Rule = module.exports = function(options, core){
  
  this.name         = options.name || 'rule' + core.rules.length;
  this.allowed      = options.allowed || false;
  this.redirect     = options.redirect || core.redirect;
  this.mode         = options.mode || 'redirect';

  // Every rule type that needs to be asked is in that list (e.g. category, match, group)
  this.types = [];
    
  this.core = core;
  this.log = this.core.log;
  
  for(var i in this.core.rule_configs){
    this.core.rule_configs[i].call(this, options);
  }
  
  this.buildCallbackList();
  
};

Rule.prototype.isAllowed = function(options, callback){
  var self = this;
  
  if(this.types.length > 0){
    async.parallel(this.type_callbacks(options), function(err, results){
      if(err){
        //if there was an error == some type did not match
        callback(null);
      }else{
        callback(self.allowed ? true : self.redirect);
      }
    });
  }else{
    //if there are no matches defined - it matches!
    callback(self.allowed ? true : self.redirect);
  }
};


Rule.prototype.buildCallbackList = function(){
  this.types = uniq(this.types);
  
  var self  = this;
  var tmp = [];
  
  for(var i in this.types){
    (function(type_method){
      tmp.push(function(callback){
        type_method.call(self, self.current_options, callback);
      });
    })(this.core.rule_types[this.types[i]]);
  }
  
  
  this.type_callbacks = function(options){
    self.current_options = options;    
    return tmp;
  };
  
};

function uniq(arr){
   var u = {}, a = [];
   for(var i = 0, l = arr.length; i < l; ++i){
      if(u.hasOwnProperty(arr[i])) {
         continue;
      }
      a.push(arr[i]);
      u[arr[i]] = 1;
   }
   return a;
}