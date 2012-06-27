module.exports = {
  type: 'src',
  name: 'ou',
  
  config: function(options){
    this.ous = options.ous || [];  
    if(!(this.ous instanceof Array)) this.ous = [this.ous];
    
    if(this.ous.length > 0){
      this.src_types.push('ou');
    }
  },
  
  filter: function(options, callback){
    var self = this;
    
    this.cache.getUser(options.username, function(user){
      if(user && user.memberOf){
        if(self.ous.indexOf(user.dn.replace(/^CN=(.+?),/, '')) != -1){
          callback(null, true);
          return;
        }
      }
      callback(null, false);
    });
  },
  
  cache:{
    users: {},
    getUser: function(name, callback){
      var self = this;

      if(!name){
        callback(null);
        return;
      }

      if(this.users[name]){
        if(this.users[name] instanceof Array){
          //if there is a second request while we are searching for a user... put that one in the queue
          this.users[name].push(callback);
        }else{
          callback(this.users[name]);
        }    
      }else{
        if(this.ldap){
          self.users[name] = [];

          this.ldap.getUser(name, function(user){
            //call all the callbacks in the queue
            if(self.users[name].length > 0){
              for(var i in self.users[name]){
                self.users[name][i](user);
              }
            }

            self.users[name] = user;
            callback(user);
          });
        }else{
          callback(null);
        }    
      }
    }
  }
};