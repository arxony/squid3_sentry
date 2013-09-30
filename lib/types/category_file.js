var util = require('util');
var CategoryType = require('./category');


var CategoryFileType = module.exports = function(sentry, rule){
  CategoryType.call(this, sentry, rule);
};

util.inherits(CategoryFileType, CategoryType);



CategoryFileType.prototype.isUsed = function(options){
  if(!options) return false;
  this.category_files = options.category_files || options.category_file || [];  
  if(!(this.category_files instanceof Array)) this.category_files = [this.category_files];
  
  if(this.category_files.length > 0){      
    options.categories = [];  
    for(var i in this.category_files){
      var path = this.category_files[i];
      var name = this.category_files[i].replace(/.*\/(.+?)/, '$1');
      
      name = name.replace(/\..+$/, '')
      
      if(path[0] != '/'){
        path = process.cwd() + '/' + path;
      }
      
      this.sentry.redis.readDomainsFromFile(path, this.sentry.name + ':' + name, {watch: options.watch});
      options.categories.push(name);
    }
    
    return CategoryType.prototype.isUsed.call(this, options);
  }
  
  return false;
};