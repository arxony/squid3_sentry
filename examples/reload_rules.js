var crypto = require('crypto');
var redis = require('redis').createClient();

var name = 'test';
var prefix = 'sentry';
var rules = [{
  name: 'nindl',
  categories: ['porn'],
  allowed: true
}];


redis.lrange(prefix + ':rules:' + name, 0, -1, function(err, elements){
  var transaction = redis.multi();
  
  if(elements.length > 0){
    transaction.del(elements);
    transaction.del(prefix + ':rules:' + name);
  }
  
  var sha;
  for(var i in rules){
    sha = crypto.createHash('sha1').update(name + i).digest('hex');
    transaction.rpush(prefix + ':rules:' + name, prefix + ':rule:' + sha);
    transaction.set(prefix + ':rule:' +  sha, JSON.stringify(rules[i]));
  }
  
  transaction.publish(name, 'reload');
  transaction.exec(function(err){
    if(!err){
      console.log('Rules written!');
      process.exit(0);
    }
  });
});