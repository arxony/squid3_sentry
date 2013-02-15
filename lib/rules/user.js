module.exports = {
  name: 'user',
  
  config: function(options){
    this.users = options.users || this.users || [];  
    if(!(this.users instanceof Array)) this.users = [this.users];
    
    if(this.users.length > 0){
      this.types.push('user');
      
      for(var i=0; i<this.users.length; i++){
        this.users[i] = this.users[i].toLowerCase();
      }
    }
  },
  
  filter: function(options, callback){
    if(this.users.indexOf(options.username.toLowerCase()) != -1) callback();
    else                                                         callback('STOP');
  }  
};