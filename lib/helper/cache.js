var CacheHelper = module.exports = function(sentry, config){
  config = config || {};
  
  this.log = sentry.log.loggers.get('cache');
  
  this.items = {};
  this.sentry = sentry;
  
  this.log.info('Initialized');
};


CacheHelper.prototype.listenToRemoteCalls = function(){
  var self = this;
  this.sentry.faye.on('cache:clear', function(){
    self.clear();
  });
};


CacheHelper.prototype.set = function(key, value){
  if(key instanceof Array) key = key.join('.');
  if(!this.items[key]) this.items[key] = {};
    
  var item = this.items[key];
    
  this.log.debug('Set %s = %s', key, value);
    
  if(item.callbacks){
    
    this.log.debug('Call pending callbacks for %s', key);
    
    for(var i=0; i<item.callbacks.length; i++){
      item.callbacks[i](value);
    }
    
    delete item.callbacks;
  }
  
  item.value = value;
};


CacheHelper.prototype.exists = function(key){
  if(key instanceof Array) key = key.join('.');
  return !!this.items[key];
};


CacheHelper.prototype.lock = function(key){
  if(key instanceof Array) key = key.join('.');
  if(!this.items[key]) this.items[key] = {callbacks:[]};
  
  this.log.debug('Lock %s', key);
};


CacheHelper.prototype.get = function(key, callback){
  if(key instanceof Array) key = key.join('.');
  if(!this.items[key]) this.items[key] = {};
    
  var item = this.items[key];
  
  if(item.callbacks){
    this.log.debug('Add to callback list of %s', key);
   item.callbacks.push(callback); 
  }else{
    callback(item.value);
  }
};


CacheHelper.prototype.clear = function(){
  this.log.info('Clear');
  for(var i in this.items){
    if(this.items.hasOwnProperty(i)){
      var item = this.items[i];
      if(!item.callbacks){
        //only remove values from cache where the value isn't pending
        delete this.items[i];
      }
    }    
  }
};