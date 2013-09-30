module.exports = {
  name: 'match',
  
  config: function(options){
    this.matches = options.matches || this.matches || [];

    if(!(this.matches instanceof Array)) this.matches = [this.matches];
        
    if(this.matches.length > 0){
      
      this.types.push('match');
      
      var tmp = [];
      for(var i in this.matches){
        var match = this.matches[i];
        match = match.replace(/\./g, '\\.');
        match = match.replace(/\*/g, '.*');
        console.log('-----> MATCH:', match);
        tmp.push(new RegExp(match));
      }
      this.matches = tmp;
    }
  },
  
  filter: function(options, callback){
    console.log('FILTER!!!!');
    for(var i in this.matches){
      console.log('FITLER::::: ', this.matches[i], options.url);
      if(options.url.match(this.matches[i])){
        callback();
        return;
      }
    }  
    callback('STOP');
  }  
};