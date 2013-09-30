var TimeType = module.exports = function(sentry, rule){
  this.sentry = sentry;
  this.log = rule.log;
  this.rule = rule;
};

TimeType.prototype.isUsed = function(options){
  if(!options) return false;
  this.times = options.times || options.time || [];  
  if(!(this.times instanceof Array)) this.times = [this.times];

  if(this.times.length > 0){
    var self = this;

    self.checkTime(self);
    
    setInterval(function(){      
      self.checkTime();
    }, 1000 * 60); //check the time every minute...
    return true;
  }
  
  return false;
};


TimeType.prototype.filter = function(options, callback){
  if(this.in_time === true){
    this.log.debug('%d Rule is active (%s)', options.request, this.rule.name);
    callback();
    return;
  }
  callback('STOP'); 
};




//TODO: check times and calculate the time since the next change...
TimeType.prototype.checkTime = function(){  
  this.in_time = false;
  
  var now = new Date();
  
  var current = {
    year:    now.getFullYear(),
    month:   now.getMonth(),
    day:     now.getDate(),
    week:    this.getWeek(now),
    weekday: now.getDay(),
    hour:    now.getHours(),
    minute:  now.getMinutes()
  };
  
  //loop over all configured times
  for(var i in this.times){
    var time    = this.times[i];
    var in_time = true;
    
    //loop over the `current` object
    for(var type in current){
      if(time[type]){
        var tmp = false;
        if(!(time[type] instanceof Array)) time[type] = [time[type]];
        
        //and now over the elements of the type
        for(var x in time[type]){
          var value = time[type][x].toString().split('-');
          if(value.length > 1){
            //range
            if(parseInt(value[0], 10) <= current[type] && current[type] <= parseInt(value[1], 10)){
              tmp = true;
            }
          }else{
            //single value
            if(value == current[type]){
              tmp = true;
            }
          }
        }
        if(!tmp){
          in_time = false;
        }
      }
    }
    
    if(in_time){
      this.in_time = in_time;
      return;
    }
  }
};


//https://gist.github.com/dblock/1081513
TimeType.prototype.getWeek = function( d ) { 
 
  // Create a copy of this date object  
  var target  = new Date(d.valueOf());  
  
  // ISO week date weeks start on monday  
  // so correct the day number  
  var dayNr   = (d.getDay() + 6) % 7;  
 
  // Set the target to the thursday of this week so the  
  // target date is in the right year  
  target.setDate(target.getDate() - dayNr + 3);  
 
  // ISO 8601 states that week 1 is the week  
  // with january 4th in it  
  var jan4    = new Date(target.getFullYear(), 0, 4);  
 
  // Number of days between target date and january 4th  
  var dayDiff = (target - jan4) / 86400000;    
 
  // Calculate week number: Week 1 (january 4th) plus the    
  // number of weeks between target date and january 4th    
  var weekNr = 1 + Math.ceil(dayDiff / 7);    
 
  return weekNr;
};