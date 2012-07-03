var url = require('url');

module.exports = {
  type: 'dest',
  name: 'filetype',
  
  config: function(options){
    this.file_types = options.file_types || this.file_types || [];

    if(!(this.file_types instanceof Array)) this.file_types = [this.file_types];
        
    if(this.file_types.length > 0){
      this.dest_types.push('filetype');
    }
  },
  
  filter: function(options, callback){
    var parts = url.parse(options.url);
    
    for(var i in this.file_types){
      if(parts.pathname.match('\\.' + this.file_types[i])){
        callback(null, true);
        return;
      }
    }  
    callback(null, false);
  }  
};