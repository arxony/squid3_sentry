var Netmask = require('netmask').Netmask;

module.exports = {
  name: 'ip',
  
  config: function(options){
    this.ips = options.ips || this.ips || [];

    if(!(this.ips instanceof Array)) this.ips = [this.ips];

    if(this.ips.length > 0){
      
      this.types.push('ip');
      
      var tmp = [];
      for(var i in this.ips){
        tmp.push(new Netmask(this.ips[i]));
      }
      this.ips = tmp;
    }
  },
  
  filter: function(options, callback){
    for(var i in this.ips){
      if(this.ips[i].contains(options.ip)){
        callback();
        return;
      }
    }  
    callback('STOP');
  }  
};