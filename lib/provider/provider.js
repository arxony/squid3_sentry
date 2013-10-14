var Provider = module.exports = function(config){
  this.config = config;
};

Provider.prototype.use = function(sentry){
  this.isAllowed = sentry.isAllowed;
  this.log = sentry.log;
};

Provider.prototype.start = function(){
  throw new Error('No start method defined!');
};