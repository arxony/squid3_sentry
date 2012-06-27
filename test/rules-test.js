var vows = require('vows');
var assert = require('assert');

var Cache = require('../lib/cache');
var Rule = require('../lib/rule');

var cache = vows._cache; /*new Cache({
  redirect: 'default.com'
});*/

cache.redirect = 'default.com';


cache.addRuleDefinition(require('../lib/rules/match'));
cache.addRuleDefinition(require('../lib/rules/filetype'));
cache.addRuleDefinition(require('../lib/rules/ip'));
//cache.addRuleDefinition(require('../lib/rules/category'));
cache.addRuleDefinition(require('../lib/rules/time'));
//cache.addRuleDefinition(require('../lib/rules/group'));
cache.addRuleDefinition(require('../lib/rules/user'));
cache.addRuleDefinition(require('../lib/rules/ou'));
/*
cache.setLdapConf({
  url: 'ldap://10.20.30.66:389',
  dn: 'CN=ldap_auth,CN=Users,DC=dabeach,DC=lan',
  password: 'ooDahs0i',
  base: 'DC=dabeach,DC=lan'
});
*/

var _w = vows._w;


var now = new Date();
var now_min = now.getMinutes();
var now_hour = now.getHours();


function test(domain, rule_options, callback){
  var r = new Rule(rule_options, cache);
  r.isAllowed({domain:domain}, _w(callback));
}



vows.describe('Rules').addBatch({
  'rule default':{
    topic: function(){
      test('google.com', {}, this.callback);
    },
    'deny all': function(t){
      assert.equal(t, 'default.com');
    }
  },
  'rule allowed':{
    topic: function(){
      test('google.com', {
        allowed:true
      }, this.callback);
    },
    'allow all': function(t){
      assert.equal(t, true);
    }
  },
  'rule denied':{
    topic: function(){
      test('google.com', {
        allowed:false
      }, this.callback);
    },
    'deny all': function(t){
      assert.equal(t, 'default.com');
    }
  },
  'rule with redirect':{
    topic: function(){
      test('google.com', {
        allowed:false,
        redirect: 'redirect.com'
      }, this.callback);
    },
    'custom redirect': function(t){
      assert.equal(t, 'redirect.com');
    }
  },
    
  'rule with match "~ogle~"':{
    topic: new Rule({
      allowed:false,
      matches:['*ogle*']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com'}, _w(this.callback));
      },
      'google.com': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'other.com'}, _w(this.callback));
      },
      'other.com': function(t){
        assert.isNull(t);
      }
    }
  },
  
  'rule with matches "~ogle~" and "~hub.com"':{
    topic: new Rule({
      allowed:false,
      matches:['*ogle*', '*hub.com']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'github.com'}, _w(this.callback));
      },
      'github.com': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'other.com'}, _w(this.callback));
      },
      'other.com': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  'rule with category "porn"':{
    topic: new Rule({
      allowed:false,
      categories:['porn']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'www.sex.com'}, _w(this.callback));
      },
      'sex.com': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com'}, _w(this.callback));
      },
      'google.com': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  'rule with categories "porn" and "webmail"':{
    topic: new Rule({
      allowed:false,
      categories:['porn', 'webmail']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'hotmail.com'}, _w(this.callback));
      },
      'hotmail.com': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com'}, _w(this.callback));
      },
      'google.com': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  'rule with filetype "swf" and "flv"':{
    topic: new Rule({
      allowed:false,
      filetypes:['swf', 'flv']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'hotmail.com', url:'http://hotmail.com/foo/player.swf'}, _w(this.callback));
      },
      'player.swf': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com', url:'https://www.google.at/search?q=flv'}, _w(this.callback));
      },
      'google search': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  
  'rule with with ip blocks "10.69.1.0/255.255.255.0" and "10.168.1.0/24"':{
    topic: new Rule({
      allowed:false,
      ips:['10.69.1.0/255.255.255.0', '10.168.1.0/24']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com', ip: '10.168.1.55'}, _w(this.callback));
      },
      '10.168.1.55': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com', ip:'10.69.2.13'}, _w(this.callback));
      },
      '10.69.2.13': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  'rule with group "CN=Keinporn,CN=Users,DC=dabeach,DC=lan"':{
    topic: new Rule({
      allowed:false,
      groups:['CN=Keinporn,CN=Users,DC=dabeach,DC=lan']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'phil'}, _w(this.callback));
      },
      'user in group': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'other'}, _w(this.callback));
      },
      'user not in group': function(t){
        assert.isNull(t);
      }
    }
  },
  
  'rule with groups "CN=Keinporn,CN=Users,DC=dabeach,DC=lan" and "CN=Test,CN=Users,DC=dabeach,DC=lan"':{
    topic: new Rule({
      allowed:false,
      groups:['CN=Keinporn,CN=Users,DC=dabeach,DC=lan', 'CN=Test,CN=Users,DC=dabeach,DC=lan']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'felix'}, _w(this.callback));
      },
      'user in group': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'other'}, _w(this.callback));
      },
      'user not in group': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  
  'rule with user "phil"':{
    topic: new Rule({
      allowed:false,
      users:['phil']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'phil'}, _w(this.callback));
      },
      'user': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'other'}, _w(this.callback));
      },
      'other user': function(t){
        assert.isNull(t);
      }
    }
  },
  
  'rule with user "phil" and "felix"':{
    topic: new Rule({
      allowed:false,
      users:['phil', 'felix']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'felix'}, _w(this.callback));
      },
      'user': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'other'}, _w(this.callback));
      },
      'other user': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  
  'rule with ou "OU=LBS,OU=Schulen,DC=dabeach,DC=lan"':{
    topic: new Rule({
      allowed:false,
      ous:['OU=LBS,OU=Schulen,DC=dabeach,DC=lan']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'phil'}, _w(this.callback));
      },
      'user in ou': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'other'}, _w(this.callback));
      },
      'user not in ou': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  
  'rule with ous "OU=LBS,OU=Schulen,DC=dabeach,DC=lan", "OU=LFS,OU=Schulen,DC=dabeach,DC=lan"':{
    topic: new Rule({
      allowed:false,
      ous:['OU=LBS,OU=Schulen,DC=dabeach,DC=lan', 'OU=LFS,OU=Schulen,DC=dabeach,DC=lan']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'felix'}, _w(this.callback));
      },
      'user in ou': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'google.com', username:'other'}, _w(this.callback));
      },
      'user not in ou': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  'rule with time "now - now+2min"':{
    topic: new Rule({
      allowed:false,
      times:[{from:now_hour + ':' + now_min, to:now_hour + ':' + (now_min + 2)}]
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com'}, _w(this.callback));
      },
      'in time': function(t){
        assert.equal(t, 'default.com');
      }
    }
  },
  
  'rule with time "now+2min - now+4min"':{
    topic: new Rule({
      allowed:false,
      times:[{from:now_hour + ':' + (now_min + 2), to:now_hour + ':' + (now_min + 4)}]
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com'}, _w(this.callback));
      },
      'not in time': function(t){
        assert.isNull(t);
      }
    }
  },
  
  'rule with times "now - now+2min" and "now-5min - now-2min"':{
    topic: new Rule({
      allowed:false,
      times:[{from:now_hour + ':' + (now_min-5), to:now_hour + ':' + (now_min - 2)}, {from:now_hour + ':' + now_min, to:now_hour + ':' + (now_min + 2)}]
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'google.com'}, _w(this.callback));
      },
      'in time': function(t){
        assert.equal(t, 'default.com');
      }
    }
  },
    
  
  
  'rule with categories and groups':{
    topic: new Rule({
      allowed:false,
      categories:['porn', 'webmail'],
      groups:['CN=Keinporn,CN=Users,DC=dabeach,DC=lan', 'CN=Test,CN=Users,DC=dabeach,DC=lan']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'hotmail.com', username:'felix'}, _w(this.callback));
      },
      'hotmail.com with user in group': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match':{
      topic: function(rule){
        rule.isAllowed({domain:'hotmail.com', username: 'other'}, _w(this.callback));
      },
      'hotmail.com with other user': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  
  'rule with categories and times (in time)':{
    topic: new Rule({
      allowed:false,
      categories:['porn', 'webmail'],
      times:[{from:now_hour + ':' + (now_min-5), to:now_hour + ':' + (now_min - 2)}, {from:now_hour + ':' + now_min, to:now_hour + ':' + (now_min + 2)}]
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'hotmail.com', username:'felix'}, _w(this.callback));
      },
      'hotmail.com in time and category': function(t){
        assert.equal(t, 'default.com');
      }
    }
  },
  
  'rule with categories and times (not in time)':{
    topic: new Rule({
      allowed:false,
      categories:['porn', 'webmail'],
      times:[{from:now_hour + ':' + (now_min-5), to:now_hour + ':' + (now_min - 2)}, {from:now_hour + ':' + (now_min+1), to:now_hour + ':' + (now_min + 3)}]
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'hotmail.com', username:'felix'}, _w(this.callback));
      },
      'hotmail.com in category but not in time': function(t){
        assert.isNull(t);
      }
    }
  },
  
  
  
  
  'rule with categories, times and groups':{
    topic: new Rule({
      allowed:false,
      categories:['porn', 'webmail'],
      times:[{from:now_hour + ':' + (now_min-5), to:now_hour + ':' + (now_min - 2)}, {from:now_hour + ':' + now_min, to:now_hour + ':' + (now_min + 2)}],
      groups:['CN=Keinporn,CN=Users,DC=dabeach,DC=lan', 'CN=Test,CN=Users,DC=dabeach,DC=lan']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'hotmail.com', username:'felix'}, _w(this.callback));
      },
      'hotmail.com with user in group': function(t){
        assert.equal(t, 'default.com');
      }
    }
  },
  
  
  
  
  'rule with categories and matches':{
    topic: new Rule({
      name: 'test',
      allowed:false,
      categories:['porn', 'webmail'],
      matches:['sex', 'mail']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'hotmail.com', username:'felix'}, _w(this.callback));
      },
      'hotmail.com with categories and matches': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match': {
      topic: function(rule){
        rule.isAllowed({domain:'porno.com', username:'felix'}, _w(this.callback));
      },
      'hotmail.com with categories and matches': function(t){
        assert.isNull(t);
      }
    }
  },
  
  'rule with categories, matches, groups and user':{
    topic: new Rule({
      name: 'test',
      allowed:false,
      categories:['porn', 'webmail'],
      matches:['sex', 'mail'],
      groups:['CN=Keinporn,CN=Users,DC=dabeach,DC=lan', 'CN=Test,CN=Users,DC=dabeach,DC=lan'],
      users:['felix']
    }, cache),
    'matches': {
      topic: function(rule){
        rule.isAllowed({domain:'sex.com', username:'felix'}, _w(this.callback));
      },
      'sex.com categories, matches, groups and user': function(t){
        assert.equal(t, 'default.com');
      }
    },
    'doesn\'t match': {
      topic: function(rule){
        rule.isAllowed({domain:'sex.com', username:'phil'}, _w(this.callback));
      },
      'sex.com categories, matches, groups and user': function(t){
        assert.isNull(t);
      }
    }
  }
}).exportTo(module);