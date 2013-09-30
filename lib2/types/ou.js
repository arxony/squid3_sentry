var OUType = module.exports = function(sentry, rule){
  this.sentry = sentry;
  this.log = rule.log;
  this.rule = rule;
};

OUType.prototype.isUsed = function(options){
  if(!options) return false;
  this.ous = options.ous || options.ou || [];  
  if(!(this.ous instanceof Array)) this.ous = [this.ous];
  
  if(this.ous.length > 0){
    for(var i in this.ous){
      this.ous[i] = this.ous[i].replace(/, /g, ',').toLowerCase();
    }
    return true;
  }
  return false;
};


OUType.prototype.filter = function(options, callback){
  var self = this;

  this.sentry.ldap.getDnOfUser(options.username, function(dn){
    if(dn){
      dn = dn.replace(/^CN=(.+?),/i, '').replace(/, /g, ',').toLowerCase();

      for(var i in self.ous){
        if(dn.match(self.ous[i])){
          self.log.debug('%d User %s is in OU "%s" (%s)', options.request, options.username, self.ous[i], self.rule.name);
          callback();
          return;
        }
      }
    }
    callback('STOP');
  });  
};
