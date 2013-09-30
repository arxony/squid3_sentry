var GroupType = module.exports = function(sentry, rule){
  this.sentry = sentry;
  this.log = rule.log;
  this.rule = rule;
};

GroupType.prototype.isUsed = function(options){
  if(!options) return false;
  this.groups = options.groups || options.group || [];  
  if(!(this.groups instanceof Array)) this.groups = [this.groups];
  
  if(this.groups.length > 0){
    for(var i in this.groups){
      this.groups[i] = this.groups[i].replace(/, /g, ',').toLowerCase();
    }
    return true;
  }
  return false;
};


GroupType.prototype.filter = function(options, callback){
  var self = this;
  if(options.username.length > 2){
    this.sentry.ldap.isUserMemberOfGroup(options.username, self.groups, function(in_group){
      if(in_group){
        self.log.debug('%d User %s is in groups [%s] (%s)', options.request, options.username, self.groups.join(', '), self.rule.name);
        callback();
        return;    
      }
      callback('STOP');
    });
  }else{
    callback('STOP');
  }
};