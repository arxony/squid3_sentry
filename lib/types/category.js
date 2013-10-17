var CategoryType = module.exports = function(sentry, rule){
  this.sentry = sentry;
  this.log = rule.log;
  this.rule = rule;
};

CategoryType.prototype.isUsed = function(options){
  if(!options) return false;
  this.categories = options.categories || options.category || [];  
  if(!(this.categories instanceof Array)) this.categories = [this.categories];
  
  if(this.categories.length > 0){
    return true;
  } 
  return false;
};


CategoryType.prototype.filter = function(options, callback){
  var self = this;
  if(this.categories.length > 0){
    this.sentry.redis.inCategories(options, this.categories, function(in_category, categories){
      if(options.matches) options.matches.categories = categories;
      if(in_category){
        self.log.debug('%d Url %s is in categories [%s] (%s)', options.request, options.url, categories.join(', '), self.rule.name);
        callback();
      }else{
        callback('STOP');
      }
    });
  }else{
    //No categories... no match
    callback('STOP');
  }
};