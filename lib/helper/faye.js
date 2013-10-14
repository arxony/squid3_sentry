var faye = require('faye');
var util = require('util');
var events = require('events');

var FayeHelper = module.exports = function(sentry, config){
  config = config || {};
  
  this.sentry = sentry;
  this.log    = sentry.log.loggers.get('faye');
    
  var redis = sentry.redis.config;
  
  if(redis.in_memory !== true && sentry.redis.client){
    config.engine = {
      type: require('faye-redis'),
      host: redis.host,
      port: redis.port,
      password: redis.password,
      database: redis.database,
      namespace: sentry.name + ':faye:'
    };
    this.log.info('Using Redis for Faye');
  }
  
  this.createClient(config);
  this.subscribe();
  
  events.EventEmitter.call(this);
  
  this.log.info('Initialized');
};


util.inherits(FayeHelper, events.EventEmitter);



FayeHelper.prototype.createClient = function(config){
  var self = this;
  
  if((config.engine || config.port) && !config.url){
    this.server = new faye.NodeAdapter(config);
    this.server.listen(config.port);
    this.client = this.server.getClient();
    
    if(config.port){
      this.log.info('Faye server started on port %d', config.port);
    }
    
  }
  
  if(!this.client && config.url){
    this.client = new faye.Client(config.url);
    this.client.bind('transport:up', function() {
      self.log.info('Connected');
    });
  }
};


FayeHelper.prototype.subscribe = function(){
  if(!this.client) return;

  var self = this;

  this.client.subscribe('/' + this.sentry.name, function(msg){
    if(msg.action && typeof msg.action == 'string'){
      self.log.info('Received action %s', msg.action);
      self.emit(msg.action, msg);
    }
  });
  
  this.log.info('Listen on channel "/%s"', this.sentry.name);
  
};