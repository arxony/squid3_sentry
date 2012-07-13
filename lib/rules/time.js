module.exports = {
  name: 'time',
  
  config: function(options){
    var self = this;

    this.times = options.times || this.times || [];  
    if(!(this.times instanceof Array)) this.times = [this.times];

    if(this.times.length > 0){

      this.types.push('time');

      checkTime(self);

      setInterval(function(){      
        checkTime(self);
      }, 1000 * 60); //check the time every minute...
    }
  },
  
  filter: function(options, callback){
    if(this.in_time === true){
      callback();
      return;
    }
    callback('STOP');
  }  
};




//TODO: check times and calculate the time since the next change...
function checkTime(rule){  
  rule.in_time = false;
  
  var now = new Date();
  
  for(var i in rule.times){
    var time    = rule.times[i];
    var in_time = true;
    
    if(time.year && time.year != now.getFullYear()){
      in_time = false;
    }
    
    if(in_time && time.month && time.month != now.getMonth()){
      in_time = false;
    }
    
    if(in_time && time.day && time.day != now.getDate()){
      in_time = false;
    }
    
    
    if(in_time && time.week_day && time.week_day != now.getDay()){
      in_time = false;
    }
    
    if(in_time && time.from && time.from.match(/\d+:\d+/) && time.to && time.to.match(/\d+:\d+/)){
      var parts, from, to, current_time;
      
      parts = time.from.split(':');
      from  = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);    
      parts = time.to.split(':');
      to    = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      
      current_time = now.getHours() * 60 + now.getMinutes();
      
      if(from > current_time || current_time > to){
        in_time = false;
      }      
    }
    
    if(in_time){
      rule.in_time = true;
      return;
    }    
  }
};