var crypto = require('crypto');
var redis = require('redis').createClient();

var name = 'test';
var prefix = 'sentry';
var rules = [{
  name: 'rule1',
  allowed: false,
  categories: ['porn', 'spyware'],
  groups: ['CN=Keinporn,CN=Users,DC=dabeach,DC=lan'],
  redirect: 'no-porn.com'
}/*

// Redirect everything to google search
{
  name: 'allow google',
  allowed: true,
  matches: ['*google*', '*no-porn*']
},{
  name: 'google it',
  redirect: 'www.google.com/search?q=[domain]'
},*//*

// Return a picture of the site!
{
  name: 'allow snapr',
  allowed: true,
  matches: ['*snapr.seekxl*']
},{
  name: 'take picure',
  redirect: 'http://snapr.seekxl.de/?url=[url]&size=M',
  mode: 'rewrite'
},*//*

// Allow flash only for miniclip.com
{
  name: 'allow flash on miniclip.com',
  allowed: true,
  file_types: ['swf'],
  matches: ['*miniclip.com']
},{
  name: 'deny flash for everything else',
  file_types: ['swf']
}*/
];


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
      console.log('Rules reloaded!');
      process.exit(0);
    }
  });
});
