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

    this.core.getDnOfUser(options.username, function(dn){
      if(dn){
        for(var i in self.ous){
          if(dn.replace(/^CN=(.+?),/i, '').match(self.ous[i])){
            callback();
            return;
          }
        }
      }
      callback('STOP');
    });
  }
};