module.exports = {
  type: 'dest',
  name: 'category',
  
  config: function(options){
    this.categories = options.categories || this.categories || [];  
    if(!(this.categories instanceof Array)) this.categories = [this.categories];
    
    if(this.categories.length > 0){
      this.dest_types.push('category');
    }
  },
  
  filter: function(options, callback){
    if(this.categories.length > 0){
      this.core.domainInCategories(options.domain, this.categories, function(in_category){
        callback(null, in_category);
      });
    }else{
      //No categories... no match
      callback(null, false);
    }
  },
  
  
  cache: {
    categories: {}, //e.g. {'www.google.com':{'categorie': false, 'search':true}}
    
    purge: function(target){
      //purge cache, but don't remove waiting callbacks
      var self = this;

      for(var domain in this.categories){
        for(var category in this.categories[domain]){
          if(this.categories[domain][category] instanceof Array){
            //Array with callbacks waiting for a result
            (function(domain, category, callbacks){
              
              //delete the queue
              delete self.categories[domain][category];
              
              //ask again for the answer
              self.domainInCategories(domain, category.split('_'), function(answer){
                //Tell it all callbacks in the original queue
                for(var i in callbacks){
                  callbacks[i](answer);
                }
                
              });
              
            })(domain, category, this.categories[domain][category]);
            
          }else{
            delete this.categories[domain][category];
          }
        }
      }
    
    },
    
    domainInCategories: function(domain, categories, callback){

      var self = this;
      var category = categories;
      
      if(categories instanceof Array){
        category = categories.join('_');
      }
      
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
          this.categories[domain][category] = [callback]; //put it into the callback queue

          this.redis.containsDomain(categories, domain, function(in_category){

            self.categories[domain] = self.categories[domain] || {};

            //call all the callbacks in the queue (if there is nothing: cache was cleared)
            if(self.categories[domain][category].length > 0){
              
              var callbacks = self.categories[domain][category];
              self.categories[domain][category] = in_category;
              
              for(var i in callbacks){
                callbacks[i](in_category);
              }
            }
            
          });
          
        }else{
          callback(false);
        }    
      }
    }
  }
  
};