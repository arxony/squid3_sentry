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
      this.core.isUserMemberOfGroup(options.username, self.groups, function(in_group){
        if(in_group){
          callback();
          return;    
        }
        callback('STOP');
      });
    }else{
      callback('STOP');
    }
  },
  
  cache:{
    dns: {}, // {'username':dn}
    groups: {}, //{'username||group1::group1':true/false}
    
    purge: function(){
      //purge cache, but don't remove waiting callbacks
      var self = this;

      for(var username in this.dns){
        if(this.dns[username] instanceof Array){
          //Array with callbacks waiting for a result
          (function(username, callbacks){
            
            //delete the queue
            delete self.dns[username];
            
            //ask again for the answer
            self.getDnOfUser(username, function(dn){
              //Tell it all callbacks in the original queue
              for(var i in callbacks){
                callbacks[i](dn);
              }
              
            });
            
          })(username, this.dns[username]);
          
        }else{
          delete this.dns[username];
        }
      }
      
      
      
      for(var identifier in this.groups){
        if(this.groups[identifier] instanceof Array){
          //Array with callbacks waiting for a result
          (function(identifier, callbacks){
            
            //delete the queue
            delete self.groups[identifier];
                      
            var username = identifier.split('||')[0];
            var groups = identifier.split('||')[1].split('::');
                      
            //ask again for the answer
            self.isUserMemberOfGroup(username, groups, function(dn){
              //Tell it all callbacks in the original queue
              for(var i in callbacks){
                callbacks[i](dn);
              }
              
            });
            
          })(identifier, this.groups[identifier]);
          
        }else{
          delete this.groups[identifier];
        }
      }
      
    },
    
    
    isUserMemberOfGroup: function(name, groups, callback){
      
      if(!name || !groups){
        callback(null);
        return;
      }

      var self = this;
      var identifier = name + '||' + groups.join('::');

      //check cache
      if(this.groups[identifier] !== null && this.groups[identifier] !== undefined){
        if(this.groups[identifier] instanceof Array){
          //if there is a second request while we are searching for a user... put that one in the queue
          this.groups[identifier].push(callback);
        }else{
          callback(this.groups[identifier]);
        }    
      }else{
        if(this.ldap){
          self.groups[identifier] = [];

          this.ldap.isMemberOfGroups(name, groups, function(in_group, dn){
            //call all the callbacks in the queue
            if(self.groups[identifier].length > 0){
              for(var i in self.groups[identifier]){
                self.groups[identifier][i](in_group);
              }
            }
            
            //write it into the users cache as well
            if(!(self.dns[name] instanceof Array)) self.dns[name] = dn;
            self.groups[identifier] = in_group;
            callback(in_group);
          });
        }else{
          callback(null);
        }    
      }
    },
    
    
    getDnOfUser: function(name, callback){
      var self = this;

      if(!name){
        callback(null);
        return;
      }

      //check cache
      if(this.dns[name]){
        if(this.dns[name] instanceof Array){
          //if there is a second request while we are searching for a user... put that one in the queue
          this.dns[name].push(callback);
        }else{
          callback(this.dns[name]);
        }    
      }else{
        if(this.ldap){
          self.dns[name] = [];

          this.ldap.getUser(name, function(user){
            //call all the callbacks in the queue
            if(self.dns[name].length > 0){
              for(var i in self.dns[name]){
                self.dns[name][i](user.dn);
              }
            }

            self.dns[name] = user.dn;
            callback(user.dn);
          });
        }else{
          callback(null);
        }    
      }
    }
  }
};