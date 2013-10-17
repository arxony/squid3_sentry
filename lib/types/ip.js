var Netmask = require('netmask').Netmask;
var ip2long = require('netmask').ip2long;


var Range = function(range){
  this.range = range;
  range = range.split('-');
  this.start = ip2long(range[0]);
  this.end = ip2long(range[1]);
};

Range.prototype.contains = function(ip){
  ip = ip2long(ip);
  return this.start <= ip && ip <= this.end;
};

Range.prototype.toString = function(){
  return this.range;
};

Netmask.prototype.toString = function(){
  return this.first + '-' + this.last;
};


var IPType = module.exports = function(sentry, rule){
  this.sentry = sentry;
  this.log = rule.log;
  this.rule = rule;
};

IPType.prototype.isUsed = function(options){
  if(!options) return false;
  this.ips = options.ips || options.ip || [];

  if(!(this.ips instanceof Array)) this.ips = [this.ips];

  if(this.ips.length > 0){
      
    var tmp = [];
    for(var i in this.ips){
      if(this.ips[i].match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\-\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)){
        tmp.push(new Range(this.ips[i])); //Range
      }else{
        tmp.push(new Netmask(this.ips[i])); //Block
      }
      
    }
    this.ips = tmp;
    return true;
  }
  return false;
};


IPType.prototype.filter = function(options, callback){
  if(options.ip){
    for(var i in this.ips){
      if(this.ips[i].contains(options.ip)){
        if(options.matches) options.matches.ip = this.ips[i].toString();
        this.log.debug('%d IP %s is in "%s" (%s)', options.request, options.ip, this.ips[i].toString(), this.rule.name);
        callback();
        return;
      }
    } 
  }   
  callback('STOP');
};