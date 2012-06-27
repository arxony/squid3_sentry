var async = require('async');


/** RULE CONFIG
 *
 * name: (String) name of the rule, for debugging. Default: rule[nr]
 * allowed: (Boolean) whitelisting or blacklisting a match. Default: false
 * redirect: (String) url to redirect if it's not allowed. Default: [see core config]
 * categories: (Array) Strings of category names. Optional
 * matches: (Array) Wildcard matches for a url/domain (e.g. ['*.domain.com', 'domain.com']). Optional
 * filetypes: (Array) filetype endings (e.g. ['swf', 'flv']). Optional
 * times: (Array) Objects with time definitions (e.g. [{day:2, from:'00:00', to:'17:00'}]). Optional
 * groups: (Array) Groups LDAP paths (e.g. ['CN=Group1,CN=Users,DC=domain,DC=lan']). Optional
 * users: (Array) Users LDAP paths (e.g. ['CN=User1,CN=Users,DC=domain,DC=lan']). Optional
 * ous: (Array) OUs LDAP paths (e.g. ['OU=Special Users,CN=Users,DC=domain,DC=lan']). Optional
 *
 **/

  
var Rule = module.exports = function(options, cache){
  
  this.name         = options.name || 'rule' + cache.rules.length;
  this.allowed      = options.allowed || false;
  this.redirect     = options.redirect || cache.redirect;
  this.mode         = options.mode || 'redirect';
  
  //Every rule can have multiple rule types (e.g. dest: category, match, src: group, user, ou)
  this.dest_types    = [];
  this.src_types     = [];
  this.misc_types    = [];
    
  this.cache = cache;
  
  for(var i in this.cache.rule_configs){
    this.cache.rule_configs[i].call(this, options);
  }
    
};

Rule.prototype.isAllowed = function(options, callback){
  var self = this;

  var match = {
    dest: false,
    src: false,
    misc: false
  };
  
  
  var callbacks = {};
  
  //build up the callbacks hash
  //every type gets is's own method {dest:function(), src:fuction}
  for(var type in match){    
    if(this[type + '_types'].length > 0){
        
      (function(type, rule_types){
        var rule_type_callbacks = [];
        for(var i in rule_types){
          rule_type_callbacks.push(function(callback){
            self.cache.rule_types[type][rule_types[i]].call(self, options, callback);
          });
        }
        
        //this method will call again async.parallel to get all results from the different rule types (e.g. category and match)
        callbacks[type] = function(callback){
          async.parallel(rule_type_callbacks, function(err, results){

            //Loop over the results and combine them.
            //All results are the same -> return it. Results have differences -> return false!
            var tmp = null;
            for(var r in results){
              if(tmp == null) tmp = results[r];
              if(results[r] != tmp){
                callback(null, false);
                return;
              }
            }
            callback(null, tmp);
            
          });
        };
        
      })(type, this[type + '_types']);
      
    }else{
      match[type] = true;
    }
  }
 
  
  if(match['dest'] && match['src'] && match['misc']){
    //no valid dest, src and misc type given...
    callback(this.allowed ? true : this.redirect);
  }else{
    //parallel dest, src and misc type callback calls
    async.parallel(callbacks, function(err, results){

      if(results['dest'] != false && results['src'] != false && results['misc'] != false){
        //dest and src match
        callback(self.allowed ? true : self.redirect);
      }else{
        //no match
        callback(null);
      }
      
    });
  }
};