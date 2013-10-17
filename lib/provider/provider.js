var Provider = module.exports = function(config){
  this.config = config;
};

Provider.prototype.use = function(sentry){
  this.sentry = sentry;
};

Provider.prototype.start = function(){
  throw new Error('No start method defined!');
};

Provider.prototype.isAllowed = function(options, callback){
  this.sentry.isAllowed(options, callback);
};