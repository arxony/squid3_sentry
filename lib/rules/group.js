module.exports = {
  type: 'src',
  name: 'group',
  
  config: function(options){
    this.groups = options.groups || this.groups || [];  
    if(!(this.groups instanceof Array)) this.groups = [this.groups];
    
    if(this.groups.length > 0){
      this.src_types.push('group');
    }
  },
  
  filter: function(options, callback){
    var self = this;

    this.cache.getUser(options.username, function(user){
      if(user && user.memberOf){
        for(var i in user.memberOf){
          if(self.groups.indexOf(user.memberOf[i]) != -1){
            callback(null, true);
            return;
          }          
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