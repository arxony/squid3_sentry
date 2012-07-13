module.exports = {
  name: 'user',
  
  config: function(options){
    this.users = options.users || this.users || [];  
    if(!(this.users instanceof Array)) this.users = [this.users];
    
    if(this.users.length > 0){
      this.types.push('user');
    }
  },
  
  filter: function(options, callback){
    if(this.users.indexOf(options.username) != -1) callback();
    else                                           callback('STOP');
  }  
};