var ldap = require('ldapjs');

var Ldap = module.exports = function(config){
  
  if(!config.url) throw new Error('LDAP url (e.g. ldap://domain.local) is missing!');
  if(!config.dn) throw new Error('LDAP bind DN (e.g. CN=Administrator,CN=Users,DC=domain,DC=lan) is missing!');
  if(!config.password) throw new Error('LDAP bind password is missing!');
  if(!config.base) throw new Error('LDAP base (e.g. DC=domain,DC=lan) is missing!');
    
  this.url      = config.url;
  this.dn       = config.dn;
  this.password = config.password;
  this.base     = config.base;

  this.open();
  
};

//Open the connection
Ldap.prototype.open = function(){
  //create the ladp client
  this.client = ldap.createClient({
    url: this.url
  });

  //authenticate and bind to ldap server
  this.client.bind(this.dn, this.password, function(err) {
    console.log('LDAP bind error:', err.message);
  });
  
};


//Close the connection
Ldap.prototype.close = function(){
  this.client.unbind();
};

//general search
Ldap.prototype.search = function(options, callback){
  var self = this;

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
        //retry the search... sometime we'll lose the connection, thanks AD
        searchErrorRetry.call(self, 'LDAP search error: '+ err, options, callback);   
      });
      
    }else{
      //retry. close the current connect and open it again...
      self.close();
      self.open();
      
      searchErrorRetry.call(self, 'LDAP error: '+ err, options, callback);      
    }
  });
};


//Search helper to get a user by name or path
Ldap.prototype.getUser = function(name, callback){
  var options = getPrincipalOptions(name);
  options.attributes = ['memberOf'];

  this.search(options, function(results){
    callback(results[0]);
  });
};

//Search helper to get a group by name or path
Ldap.prototype.getGroup = function(name, callback){ 
  var options = getPrincipalOptions(name);
  options.attributes = ['member'];
  
  this.search(options, function(results){
    callback(results[0]);
  });
};



//Helper to greate the search options.
//will create search options by samaccountname or path
function getPrincipalOptions(name){
  var options = {
    scope:'sub', 
    filter:'(sAMAccountName=' + name + ')'
  };
  
  var cn_match = name.match('CN=(.+?),(.+)');
  
  if(cn_match){
    options.filter = '(cn=' + cn_match[1] + ')';
    
    //set the scope and base for faster search (no recursive search!)
    options.scope  = 'one';
    options.base   = cn_match[2];
  }
  
  return options;
}

function searchErrorRetry(err, options, callback){
  options.retries = options.retries || 0;
  options.retries++;
  if(options.retries <= 3){
    this.search(options, callback);
  }else{
    console.log(err);
    callback([]);
  }
}