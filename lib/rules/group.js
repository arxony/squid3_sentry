module.exports = {
  name: 'group',
  
  config: function(options){
    this.groups = options.groups || this.groups || [];  
    if(!(this.groups instanceof Array)) this.groups = [this.groups];
    
    if(this.groups.length > 0){
      this.types.push('group');
    }
  },
  
  filter: function(options, callback){
    var self = this;
    if(options.username.length > 2){
      this.core.getUser(options.username, function(user){
        if(user && user.memberOf){
          if(typeof user.memberOf == 'string') user.memberOf = [user.memberOf];
          for(var i in user.memberOf){
            if(self.groups.indexOf(user.memberOf[i]) != -1){
              callback();
              return;
            }          
          }
        }
        callback('STOP');
      });
    }else{
      callback('STOP');
    }
  },
  
  cache:{
    users: {}, // {'username':{user object}}
    
    purge: function(){
      //purge cache, but don't remove waiting callbacks
      var self = this;

      for(var username in this.users){
        if(this.users[username] instanceof Array){
          //Array with callbacks waiting for a result
          (function(username, callbacks){
            
            //delete the queue
            delete self.users[username];
            
            //ask again for the answer
            self.getUser(username, function(answer){
              //Tell it all callbacks in the original queue
              for(var i in callbacks){
                callbacks[i](answer);
              }
              
            });
            
          })(username, this.users[username]);
          
        }else{
          delete this.users[username];
        }
      }
    },
    
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