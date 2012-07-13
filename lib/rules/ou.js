module.exports = {
  name: 'ou',
  
  config: function(options){
    this.ous = options.ous || this.ous || [];  
    if(!(this.ous instanceof Array)) this.ous = [this.ous];
    
    if(this.ous.length > 0){
      this.types.push('ou');
    }
  },
  
  filter: function(options, callback){
    var self = this;

    this.core.getUser(options.username, function(user){
      if(user && user.memberOf){
        if(self.ous.indexOf(user.dn.replace(/^CN=(.+?),/, '')) != -1){
          callback();
          return;
        }
      }
      callback('STOP');
    });
  }
  
  //use cache definition of the group definition!
};