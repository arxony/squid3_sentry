var UserType = module.exports = function(sentry, rule){
  this.sentry = sentry;
  this.log = rule.log;
  this.rule = rule;
};

UserType.prototype.isUsed = function(options){
  if(!options) return false;
  this.users = options.users || options.user || [];  
  if(!(this.users instanceof Array)) this.users = [this.users];
    
  if(this.users.length > 0){    
    for(var i=0; i<this.users.length; i++){
      this.users[i] = this.users[i].toLowerCase();
    }
    return true;
  }  
  return false;
};


UserType.prototype.filter = function(options, callback){
  if(this.users.indexOf(options.username.toLowerCase()) != -1){
    this.log.debug('%d User %s is one of [%s] (%s)', options.request, options.username, this.users.join(','), this.rule.name);
    callback();
    return;
  }     
  callback('STOP');  
};