var ldap = require('ldapjs');

var LdapHelper = module.exports = function(sentry, config){
  config = config || {in_memory: true};
  
  this.log = sentry.log.loggers.get('ldap');
  this.cache = sentry.cache;
  this.config = config;
    
  //queue of search requests while no connection is established
  this.searchQueue = [];
    
  if(config.in_memory === true){
    this.log.info('Using In-Memory Ldap');
    config.dn       = config.dn || 'dn=' + sentry.name;
    config.password = config.password || this.randomPwd(20);
    config.base     = config.base || 'dc=sentry, dc=local';
    config.port     = 55555; //Math.ceil(Math.random()*90000 + 10000); //Random port
    
    //this.createClient will be called after the server is ready. Set this.client to true, so every request made before will be added to the queue
    this.client = true;
    this.createLdapServer(config);
  }else{
    this.createClient(config); 
  }   
  
  this.base      = config.base;
  this.ldap_type = config.ldap_type;
  this.ready     = false;  
  
  this.log.info('Initialized');
};




LdapHelper.prototype.createClient = function(config){
  
  var self           = this;
  var url            = config.url;
  var maxConnections = config.maxConnections || 10;
  var dn             = config.dn;
  var password       = config.password;
   
  if(!url){
    return;
  }
      
  //create the ladp client
  this.client = ldap.createClient({
    url: url,
    maxConnections: maxConnections
  });
    
  //authenticate and bind to the ldap server
  this.client.bind(dn, password, function(err) {
    if(err){
      self.log.error('%s: %s (%s)', err.name, err.message, err.code);
    }else{
      self.log.info('Connected');

      self.ready = true;
      
      if(self.searchQueue.length > 0){
        for(var i = 0; i < self.searchQueue.length; i++){
          var q = self.searchQueue[i];
          self.search(q.options, q.callback);
        }
      }
    }
  });

};



LdapHelper.prototype.createLdapServer = function(config){
  var self = this;
  this.server = ldap.createServer();
  
  var db = {};
  var tmp_db = config.db || {};
  tmp_db[config.base] = {};
  
  
  //make all dn names lowercase and without spaces
  var attributes = ['members', 'memberof', 'uid'];
  for(var i in tmp_db){
    if(tmp_db.hasOwnProperty(i)){
      var dn = i.replace(/, /g, ',').toLowerCase();
      db[dn] = tmp_db[i];
    
      for(var x in attributes){
        if(db[dn][attributes[x]]){
          if(db[dn][attributes[x]] instanceof Array){
            db[dn][attributes[x]].map(function(a){return a.replace(/, /g, ',').toLowerCase();});
          }else{
            db[dn][attributes[x]] = db[dn][attributes[x]].replace(/, /g, ',').toLowerCase();
          }
        }      
      }
    }
  }
  
  function authorize(req, res, next) {
    if (!req.connection.ldap.bindDN.equals(config.dn)){
      return next(new ldap.InsufficientAccessRightsError());
    }
    return next();
  }

  this.server.bind(config.dn, function(req, res, next) {
    if (req.dn.toString() !== config.dn || req.credentials !== config.password){
      return next(new ldap.InvalidCredentialsError());
    }
    res.end();
    return next();
  });
  
  this.server.search(config.base, authorize, function(req, res, next) {

    var dn = req.dn.toString().replace(/, /g, ',').toLowerCase();

    if (!db[dn]){
      return next(new ldap.NoSuchObjectError(dn));
    }

    var scopeCheck;
    
    switch (req.scope) {
      case 'base':
        if (req.filter.matches(db[dn])) {
          res.send({
            dn: dn,
            attributes: db[dn]
          });
        }

        res.end();
        return next();

      case 'one':
        scopeCheck = function(k) {
          if (req.dn.equals(k))
            return true;

          var parent = ldap.parseDN(k).parent();
          return (parent ? parent.equals(req.dn) : false);
        };
        break;

      case 'sub':
        scopeCheck = function(k) {
          return (req.dn.equals(k) || req.dn.parentOf(k));
        };

        break;
    }

    Object.keys(db).forEach(function(key) {
      
      if (!scopeCheck(key))
        return;

      if (req.filter.matches(db[key])) {
        res.send({
          dn: key,
          attributes: db[key]
        });
      }
    });

    res.end();
    return next();
  });
  
  
  this.server.listen(config.port, function(){
    config.url = self.server.url;
    self.log.info('Ldap server started: %s', config.url);
    
    self.createClient(config);
  });

};


//general search
LdapHelper.prototype.search = function(options, callback){
  var self = this;
  
  if(!this.ready){
    this.searchQueue.push({
      options: options,
      callback:callback
    });
    return;
  }
  
  
  this.log.debug('Search', options);
  this.client.search(options.base || this.base, options, function(err, res) {
    var entries = [];
    
    if(!err){
      //got an element...
      res.on('searchEntry', function(entry) {
        entries.push(entry.object);
      });

      //finished search... 
      res.on('end', function() {
        self.log.debug('Search finished with %d entries', entries.length);
        callback(entries);
      });

      res.on('error', function(err) {
        callback(entries);
        self.log.error('%s: %s (%s)', err.name, err.message, err.code);
      });
      
    }else{
      callback(entries);
      self.log.error('%s: %s (%s)', err.name, err.message, err.code);
    }
  });
  
};



LdapHelper.prototype.isUserMemberOfGroup = function(name, groups, callback){
  
  if(!name || !groups){
    callback(null);
    return;
  }

  var self = this;
  var group = groups.join(':');
  
  name = name.toLowerCase();
  
  
  if(this.cache.exists(['group', name, group])){
    this.cache.get(['group', name, group], callback);
  }else{
    if(this.client){
      
      this.cache.lock(['group', name, group]);
    
      var filter = [];
      if(typeof groups == 'string') groups = [groups];

      for(var i = 0; i < groups.length; i++){
        filter.push('(' + this.getLdapAttribute('memberOf') + '=' + groups[i] + ')');
      }

      this.search({
        filter:     '(&(' + this.getLdapAttribute('username') + '=' + name + ')(|' + filter.join('') + '))',
        scope:      'sub',
        attributes: ['dn']
      }, function(results){
        var in_group = results.length > 0;
                
        if(in_group){
          //write it into the users cache as well
          self.cache.set(['dn', name], results[0].dn);
        }
        
        self.cache.set(['group', name, group], in_group);
        callback(in_group);
        
      });
    }else{
      callback(null);
    }
  }
};



LdapHelper.prototype.getDnOfUser = function(name, callback){
  var self = this;

  if(!name){
    callback(null);
    return;
  }

  //check cache
  if(this.cache.exists(['dn', name])){
    this.cache.get(['dn', name], callback);    
  }else{
    if(this.client){
      
      this.cache.lock(['dn', name]);
      
      var options = this.getPrincipalOptions(name, this.getLdapAttribute('username'));
      options.attributes = ['dn'];

      this.search(options, function(results){
        var user = results[0];
        var dn = user ? user.dn : null;
        //set cache
        self.cache.set(['dn', name], dn);
        callback(dn);        
        
      });

    }else{
      callback(null);
    }    
  }
};





//Helper methods

LdapHelper.prototype.getLdapAttribute = function(type){
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


LdapHelper.prototype.getPrincipalOptions = function(name, attribute){
  var options = {
    scope:'sub', 
    filter:'(' + attribute + '=' + name + ')'
  };
  
  var cn_match = name.match(/CN=(.+?),(.+)/i);
  
  if(cn_match){
    options.filter = '(cn=' + cn_match[1] + ')';
    
    //set the scope and base for faster search (no recursive search!)
    options.scope  = 'one';
    options.base   = cn_match[2];
  }
  
  return options;
};



LdapHelper.prototype.randomPwd = function(length){
  var text = '';
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for(var i=0; i<length; i++){
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
};