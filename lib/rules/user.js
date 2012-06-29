module.exports = {
  type: 'src',
  name: 'user',
  
  config: function(options){
    this.users = options.users || this.users || [];  
    if(!(this.users instanceof Array)) this.users = [this.users];
    
    if(this.users.length > 0){
      this.src_types.push('user');
    }
  },
  
  filter: function(options, callback){
    callback(null, this.users.indexOf(options.username) != -1);
  }  
};