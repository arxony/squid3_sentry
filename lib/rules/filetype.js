var url = require('url');

module.exports = {
  type: 'dest',
  name: 'filetype',
  
  config: function(options){
    this.filetypes = options.filetypes || this.filetypes || [];

    if(!(this.filetypes instanceof Array)) this.filetypes = [this.filetypes];
        
    if(this.filetypes.length > 0){
      this.dest_types.push('filetype');
    }
  },
  
  filter: function(options, callback){
    var parts = url.parse(options.url);
    
    for(var i in this.filetypes){
      if(parts.pathname.match('\\.' + this.filetypes[i])){
        callback(null, true);
        return;
      }
    }  
    callback(null, false);
  }  
};