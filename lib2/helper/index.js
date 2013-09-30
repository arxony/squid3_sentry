var Rules       = require('./rules');
var LDAPHelper  = require('./ldap');
var RedisHelper = require('./redis');
var CacheHelper = require('./cache');
var FayeHelper  = require('./faye');

module.exports = {
  rules: function(sentry, config){
    return new Rules(sentry, config);
  },
  
  ldap: function(sentry, config){
    return new LDAPHelper(sentry, config);
  },
    
  redis: function(sentry, config){
    return new RedisHelper(sentry, config);
  },
  
  cache: function(sentry, config){
    return new CacheHelper(sentry, config);
  },
    
  faye: function(sentry, config){
    return new FayeHelper(sentry, config);
  },
    
  logger: require('./logger')
};