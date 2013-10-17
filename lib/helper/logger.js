var winston = require('winston');

/**
 * #Logger
 *
 * Sentry will take the `log` configuration to configure a [winston](https://github.com/flatiron/winston) logger.
 * Examples:
 * 
 *       //this will log every warn and error message to the defined file, as well as to the console
 *       log: 'path/to/your/logfile.log'
 * 
 *       //same as above, but with a different log level
 *       log: {
 *         level: 'request',
 *         file: 'logfile.log'
 *       }
 * 
 *       //this will log only for a specific category.
 *       log: {
 *         rules: {
 *           level: 'debug',
 *           file: 'rules.log'
 *         }
 *       }
 * 
 *       //this will set the general log level to `warn`. Category `rules` and `redis` are logged to a file. Category `faye` will only be logged to the console with level `info`
 *       log: {
 *         level: 'warn',
 *         
 *         rules: {
 *           level: 'request',
 *           file: {
 *             filename: 'rules.log',
 *             level: 'debug'
 *           }
 *         },
 *         
 *         redis: {
 *           level: 'warn',
 *           file: {
 *             filename: 'redis.log',
 *             level: 'debug'
 *           }
 *         },
 *         
 *         faye: {
 *           level:'info'
 *         }
 *       }
 *       
 *       
 * 
 * 
 * ##Available categories and log levels
 *
 *    - `rules`
 *      - debug
 *      - info
 *      - request  
 *      - allow
 *      - deny
 *      - no_match
 *      - warn
 *      - error
 *    - `redis`
 *      - debug
 *      - info
 *      - warn
 *      - error
 *    - `ldap`
 *      - debug
 *      - info
 *      - warn
 *      - error
 *    - `faye`
 *      - debug
 *      - info
 *      - warn
 *      - error
 *    - `cache`
 *      - debug
 *      - info
 *      - warn
 *      - error
 * 
 * 
 */

module.exports = function(sentry, config){

  //All available categories
  var categories = ['redis', 'ldap', 'faye', 'cache', 'rules'];
  var logger;

  //if there is only a string value available - treat it as a filename
  if(typeof config == 'string' || !config){
    config = {file:config};
  }
  
  //loop over all categories
  for(var i = 0; i < categories.length; i++){
    var category = categories[i];
    var conf = config[category] || config || {};
    var level = conf.level || 'warn';
    var label = category.toUpperCase();
    var tmp = {};

    //File log!  
    if(conf.file){  
      if(typeof conf.file == 'object'){
        //specific file config object
        conf.file.label = conf.file.label || label;
        conf.file.level = conf.file.level || level;
        tmp.file = conf.file;
      }else{
        //of just the filename
        tmp.file = {
          label: label,
          level: level,
          filename: conf.file
        };
      }
    }
    //Console log
    if(conf.console !== false){
      if(typeof conf.console == 'object'){
        //specific console config object
        conf.console.label = conf.console.label || label;
        conf.console.level = conf.console.level || level;
        tmp.console = conf;
      }else{
        //set the default console output
        tmp.console = {
          label: label,
          level: level
        };
      }
    }else{
      //disable console output (console: false)
      tmp.console = {
        label: label,
        level: 'none'
      };
    }
    
    //add it to the winston loggers
    logger = winston.loggers.add(category, tmp);
  }
  
  //set the levels of the last logger (category 'rules')
  logger.setLevels({
    silly: 0,
    debug: 1,
    info: 2,
    request: 3,
    allow: 4,
    deny: 5,
    no_match: 6,
    warn: 7,
    error: 8
  });
  
  return winston;
};