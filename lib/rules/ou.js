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
      if(user){
        for(var i in self.ous){
          if(user.dn.replace(/^CN=(.+?),/i, '').match(self.ous[i])){
            callback();
            return;
          }
        }
      }
      callback('STOP');
    });
  }
};