var ldap = require('ldapjs');

var Ldap = module.exports = function(config, core){
  
  if(!config.url) throw new Error('LDAP url (e.g. ldap://domain.local) is missing!');
  if(!config.dn) throw new Error('LDAP bind DN (e.g. CN=Administrator,CN=Users,DC=domain,DC=lan) is missing!');
  if(!config.password) throw new Error('LDAP bind password is missing!');
  if(!config.base) throw new Error('LDAP base (e.g. DC=domain,DC=lan) is missing!');
    
  this.url            = config.url;
  this.dn             = config.dn;
  this.password       = config.password;
  this.base           = config.base;
  this.ldap_type      = config.ldap_type || 'AD';
  this.user_attribute = config.user_attribute;
  
  this.maxConnections = config.maxConnections || 10;
  this.bind = false;
  
  this.core = core;
  
  this.searchQueue = [];
  
  this.open();
  
};

//Open the connection
Ldap.prototype.open = function(){
  var self = this;
  
  //create the ladp client
  this.client = ldap.createClient({
    url: this.url,
    maxConnections: this.maxConnections
  });
    
  //authenticate and bind to ldap server
  this.client.bind(self.dn, self.password, function(err) {
    if(err){
      self.core.log.error({error:err, source:'ldap bind'});
    }
    self.bind = true;
                      
    if(self.searchQueue.length > 0){
      for(var i in self.searchQueue){
        var q = self.searchQueue[i];
        self.search(q.options, q.callback);
      }
    }
    
  });
  
};


//Close the connection
Ldap.prototype.close = function(){
  this.client.unbind();
};

//general search
Ldap.prototype.search = function(options, callback){
  var self = this;
  
  if(!this.bind){
    this.searchQueue.push({
      options: options,
      callback:callback
    });
    return;
  }
  
  this.client.search(options.base || this.base, options, function(err, res) {
    var entries = [];
    
    if(!err){
      //got an element...
      res.on('searchEntry', function(entry) {
        entries.push(entry.object);
      });

      //finished search... 
      res.on('end', function(result) {
        callback(entries);
      });

      res.on('error', function(err) {
        callback(entries);
        self.core.log.error({error:err, source:'ldap onError'});
      });
      
    }else{
      callback(entries);
      self.core.log.error({error:err, source:'ldap search'});
    }
  });
  
};


//Search helper to get a user by name or path
Ldap.prototype.getUser = function(name, callback){
  var options = getPrincipalOptions(name, this.getLdapAttribute('username'));
  options.attributes = ['dn'];

  this.search(options, function(results){
    callback(results[0]);
  });
};


Ldap.prototype.isMemberOfGroups = function(username, groups, callback){  
  
  var filter = [];
  if(typeof groups == 'string') groups = [groups];
  
  for(var i in groups){
    filter.push("(" + this.getLdapAttribute('memberOf') + "=" + groups[i] + ")");
  }

  this.search({
    filter: "(&(" + this.getLdapAttribute('username') + '=' + username + ")(|" + filter.join('') + "))",
    scope:'sub',
    attributes:['dn']
  }, function(results){
    var in_group = results.length > 0;
    callback(in_group, in_group ? results[0].dn : null);
  });
};


Ldap.prototype.getLdapAttribute = function(type){
  switch(type){
    case 'username':
      if(this.ldap_type == 'AD') return 'sAMAccountName';
      else return this.user_attribute || 'uid';
    break;
    
    case 'memberOf':
      if(this.ldap_type == 'AD') return 'memberOf:1.2.840.113556.1.4.1941:';
      else return 'memberOf';
    break;
  }
};



//Helper to greate the search options.
//will create search options by samaccountname or path
function getPrincipalOptions(name, user_attribute){
  var options = {
    scope:'sub', 
    filter:'(' + user_attribute + '=' + name + ')'
  };
  
  var cn_match = name.match(/CN=(.+?),(.+)/i);
  
  if(cn_match){
    options.filter = '(cn=' + cn_match[1] + ')';
    
    //set the scope and base for faster search (no recursive search!)
    options.scope  = 'one';
    options.base   = cn_match[2];
  }
  
  return options;
}