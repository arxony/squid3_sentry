module.exports = {
  name: 'domain_file',
  
  config: function(options){
    var self = this;
        
    this.categories = this.categories || [];
    this.category_files = options.category_files || this.category_files || [];  
    if(!(this.category_files instanceof Array)) this.category_files = [this.category_files];
    
    if(this.category_files.length > 0){
      this.types.push('category');
      
      for(var i in this.category_files){
        var path = this.category_files[i];
        var name = this.core.name + ':' + this.category_files[i].replace(/.*\/(.+?)/, '$1');
        
        if(path[0] != '/'){
          path = process.cwd() + '/' + path;
        }
        
        if(this.core.redis){
          this.core.redis.writeDomains(name, path, {watch: true}, function(err){
            if(err) self.log.error({error:err.message, source:'category_files', rule: this});
          });
        }else{
          self.log.error({error:'Redis not configured!', source:'category_files', rule: this});
        }
        
                
        this.categories.push(name);
      }
      
    }
    
  }
  
  //We don't need a filter, because we load the file, put it into redis and let category.js do the rest!
  
};