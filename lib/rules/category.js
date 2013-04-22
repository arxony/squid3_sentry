module.exports = {
  name: 'category',
  
  config: function(options){
    this.categories = options.categories || this.categories || [];  
    if(!(this.categories instanceof Array)) this.categories = [this.categories];
    
    if(this.categories.length > 0){
      this.types.push('category');
    }
  },
  
  filter: function(options, callback){
    if(this.categories.length > 0){
      this.core.inCategories(options.url, options.domain, this.categories, function(in_category, in_categories){
        options.matching_rule.categories = in_categories;
        if(in_category) callback();
        else            callback('STOP');
      });
    }else{
      //No categories... no match
      callback('STOP');
    }
  },
  
  
  cache: {
    categories: {}, //e.g. {'www.google.com':{'categories':['list of categories the domain is included'], categorie-name': false, 'search':true}}
    
    purge: function(){
      //purge cache, but don't remove waiting callbacks
      var self = this;

      for(var url in this.categories){
        
        var remove = true;
        
        for(var category in this.categories[url]){
          if(this.categories[url][category] instanceof Array){
            remove = false;
            //Array with callbacks waiting for a result
            (function(url, category, callbacks){

              //delete the queue
              delete self.categories[url][category];
              
              //ask again for the answer
              self.inCategories(url, null, category.split('_'), function(answer, categories){

                //Tell it all callbacks in the original queue
                for(var i in callbacks){
                  if(typeof callbacks[i] == 'function'){
                    callbacks[i](answer, categories);
                  }                  
                }
                
              });
              
            })(url, category, this.categories[url][category]);
            
          }else{
            delete this.categories[url][category];
          }
        }
        if(remove){
          delete this.categories[url];
        }
        
      }
    
    },
    
    inCategories: function(url, domain, categories, callback){

      //Remove http or https...
      url = url.replace(/(.+:\/\/)/, '');

      var self = this;
      var category = categories;
      var items = [url];
                 
      if(domain){
        var parts = domain.split('.');

        while(parts.length > 1){
          items.push(parts.join('.'));
          parts.shift();
        }
      }
            
      if(categories instanceof Array){
        category = categories.join('_');
      }
      
      //if in cache
      if(this.categories[url] && this.categories[url][category]){

        if(this.categories[url][category] instanceof Array){

          //if there is a second request while we are waiting for the result... put that one in the queue
          this.categories[url][category].push(callback);
        }else{  
          
          //Read from cache  
          callback(this.categories[url][category], this.categories[url]['categories']);
        }    
      }else{
        if(this.redis){

          this.categories[url] = this.categories[url] || {};
          this.categories[url][category] = [callback]; //put it into the callback queue

          this.redis.listContainsItems(categories, items, function(in_category, in_categories){
            self.categories[url] = self.categories[url] || {categories: []};

            //call all the callbacks in the queue(if there is nothing: cache was cleared)
            if(self.categories[url][category].length > 0){

              var callbacks = self.categories[url][category];
              self.categories[url][category] = in_category;
              
              if(self.categories[url]['categories'] instanceof Array){
                self.categories[url]['categories'] = self.categories[url]['categories'].concat(in_categories);
              }else{
                self.categories[url]['categories'] = in_categories;
              }              

              for(var i in callbacks){
                callbacks[i](in_category, self.categories[url]['categories']);
              }
            }
            
          });
          
        }else{
          callback(false, []);
        }    
      }
    }
  }
  
};