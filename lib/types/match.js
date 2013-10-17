var MatchType = module.exports = function(sentry, rule){
  this.sentry = sentry;
  this.log = rule.log;
  this.rule = rule;
};

MatchType.prototype.isUsed = function(options){
  if(!options) return false;
  this.matches = options.matches || options.match || [];
  if(!(this.matches instanceof Array)) this.matches = [this.matches];
  
  if(this.matches.length > 0){    
    var tmp = [];
    for(var i in this.matches){
      var match = this.matches[i];
      if(!(match instanceof RegExp)){
        match = match.replace(/\./g, '\\.');
        match = match.replace(/\*/g, '.*');
        match = new RegExp(match);
      }
      tmp.push(match);
    }
    this.matches = tmp;

    return true;
  }
  return false;
};


MatchType.prototype.filter = function(options, callback){
  for(var i in this.matches){

    if(options.url.match(this.matches[i])){
      if(options.matches) options.matches.match = this.matches[i];
      this.log.debug('%d Url %s maches "%s" (%s)', options.request, options.url, this.matches[i], this.rule.name);
      callback();
      return;
    }
  }
  callback('STOP'); 
};