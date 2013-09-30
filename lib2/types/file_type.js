var url = require('url');

var FileType = module.exports = function(sentry, rule){
  this.sentry = sentry;
  this.log = rule.log;
  this.rule = rule;
};

FileType.prototype.isUsed = function(options){
  if(!options) return false;
  this.file_types = options.file_types || options.file_type || [];
  if(!(this.file_types instanceof Array)) this.file_types = [this.file_types];
      
  if(this.file_types.length > 0){
    return true;
  }  
  return false;
};


FileType.prototype.filter = function(options, callback){
  var parts = url.parse(options.url);
  
  for(var i in this.file_types){
    if(parts.pathname.match('\\.' + this.file_types[i])){
      this.log.debug('%d Path %s matches filetype "%s" (%s)', options.request, parts.pathname, this.file_types[i], this.rule.name);
      callback();
      return;
    }
  }  
  callback('STOP');
};