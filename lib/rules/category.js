module.exports = {
  type: 'dest',
  name: 'category',
  
  config: function(options){
    this.categories = options.categories || [];  
    if(!(this.categories instanceof Array)) this.categories = [this.categories];
    
    if(this.categories.length > 0){
      this.dest_types.push('category');
    }
  },
  
  filter: function(options, callback){
    if(this.categories.length > 0){
      this.cache.domainInCategories(options.domain, this.categories, function(in_category){
        callback(null, in_category);
      });
    }else{
      //No categories... no match
      callback(null, false);
    }
  },
  
  
  cache: {
    categories: {},
    domainInCategories: function(domain, categories, callback){
      var self = this;
      var category = categories.join('_');

      if(this.categories[domain] && this.categories[domain][category]){
        if(this.categories[domain][category] instanceof Array){
          //if there is a second request while we are waiting for the result... put that one in the queue
          this.categories[domain][category].push(callback);
        }else{          
          callback(this.categories[domain][category]);
        }    
      }else{
        if(this.redis){
          this.categories[domain] = this.categories[domain] || {};
          this.categories[domain][category] = [];
             
          this.redis.containsDomain(categories, domain, function(in_category){

            //call all the callbacks in the queue
            if(self.categories[domain][category].length > 0){
              for(var i in self.categories[domain][category]){
                self.categories[domain][category][i](in_category);
              }
            }

            self.categories[domain][category] = in_category;
            callback(in_category);
          });
        }else{
          callback(false);
        }    
      }
    }
  }
  
};