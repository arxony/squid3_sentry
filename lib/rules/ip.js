var Netmask = require('netmask').Netmask;
var ip2long = require('netmask').ip2long;


var Range = function(range){
  range = range.split('-');
  this.start = ip2long(range[0]);
  this.end = ip2long(range[1]);
};

Range.prototype.contains = function(ip){
  ip = ip2long(ip);
  return this.start <= ip && ip <= this.end;
};


module.exports = {
  name: 'ip',
  
  config: function(options){
    this.ips = options.ips || this.ips || [];

    if(!(this.ips instanceof Array)) this.ips = [this.ips];

    if(this.ips.length > 0){
      
      this.types.push('ip');
      
      var tmp = [];
      for(var i in this.ips){
        if(this.ips[i].match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\-\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)){
          tmp.push(new Range(this.ips[i])); //Range
        }else{
          tmp.push(new Netmask(this.ips[i])); //Block
        }
        
      }
      this.ips = tmp;
    }
  },
  
  filter: function(options, callback){
    for(var i in this.ips){
      if(this.ips[i].contains(options.ip)){
        if(callback) callback();
        return true;
      }
    }  
    if(callback) callback('STOP');
    return false;
  }  
};