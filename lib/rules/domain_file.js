module.exports = {
  type: 'dest',
  name: 'domain_file',
  
  config: function(options){
    var self = this;
        
    this.categories = this.categories || [];
    this.domain_files = options.domain_files || this.domain_files || [];  
    if(!(this.domain_files instanceof Array)) this.domain_files = [this.domain_files];
    
    if(this.domain_files.length > 0){
      this.dest_types.push('category');
      
      for(var i in this.domain_files){
        var path = this.domain_files[i];
        var name = this.cache.name + ':' + this.domain_files[i].replace(/.*\/(.+?)/, '$1');
        
        if(path[0] != '/'){
          path = process.cwd() + '/' + path;
        }
        
        this.cache.redis.writeDomains(name, path, {watch: true}, function(err){
          if(err && self.cache.config.explain) console.log('Error:', err);
        });
                
        this.categories.push(name);
        
        //TODO: Watch file for changes!!
      }
      
    }
    
  }
  
  //We don't need a filter, because we load the file, put it into redis and let category.js do the rest!
  
};