var helper = require('./helper');


/**
 * Examples:
 *
 *      var sentry = new Sentry({
 *        name: 'test'
 *      })
 *
 * @param {Object, String} config object or path to the config file
 * @api public
 */
var Sentry = module.exports = function(config){
    
  this.name = config.name || 'sentry';
    
  /**
   * `Winston` logger instance
   */
  this.log = helper.logger(this, config.log);
  
  /**
   * `Redis` helper
   */
  this.redis = helper.redis(this, config.redis);
  
  /**
   * `Faye` instance
   */
  this.faye = helper.faye(this, config.faye);
  
  /**
   * `Cache` helper
   */
  this.cache = helper.cache(this, config.cache);
  
  /**
   * The `Rules` Object
   */
  this.rules = helper.rules(this, config.rules);
    
  /**
   * `LDAP` helper
   */
  this.ldap = helper.ldap(this, config.ldap);
  
  
};


/**
 * Exec all loaded rules with the current options
 *
 * @param {Object} options request options like url, username
 * @param {Function} callback callback
 * @callback (Boolean: isAllowed, Rule: rule)
 * @api public
 */
Sentry.prototype.isAllowed = function(options, callback){
  this.rules.isAllowed(options, callback);
};