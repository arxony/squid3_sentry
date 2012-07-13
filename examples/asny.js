var async = require('async');


async.parallel([
  function(callback){
    console.log('A');
    callback();
  },
  
  function(callback){
    console.log('B');
    callback('ERR', 'B');
  },
  
  function(callback){
    console.log('C');
    callback(null, 'C');
  }
], function(err, result){
  console.log(err, result);
});