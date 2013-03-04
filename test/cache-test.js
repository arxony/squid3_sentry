var vows = require('vows');
var assert = require('assert');

var Core = require('../lib/core');
var Rule = require('../lib/rule');

var core = new Core({
  log: false,
  redirect: 'chache-test.default.com',
  ldap:{
    url: 'ldap://10.20.30.66:389',
    dn: 'CN=ldap_auth,CN=Users,DC=dabeach,DC=lan',
    password: 'ooDahs0i',
    base: 'DC=dabeach,DC=lan'
  },
  redis:{
    host: 'localhost'
  }
});


vows._core = core;

var _w = vows._w = function(callback) {
  //Return false as the first argument... this will be the error parameter in vows...hmh!
  return function(handler) {
    var args = Array.prototype.slice.call(arguments);
    callback.apply(this, [false].concat(args));
  };
};

vows.describe('Cache').addBatch({
  'user':{
    topic: function(){
      core.getUser('phil', _w(this.callback));
    },
    'loaded from LDAP': function(t){
      assert.isObject(t);
    },
    'correct user': function(t){
      assert.equal(t.dn, 'CN=Test test,OU=Kustoden,OU=102030,OU=Krems,OU=LBS,OU=Schulen,DC=dabeach,DC=lan');
      assert.isArray(t.memberOf);
      assert.notEqual(t.memberOf.indexOf('CN=Keinporn,CN=Users,DC=dabeach,DC=lan'), -1);
    },
    'cached':{
      topic: function(){
        core.getUser('phil', _w(this.callback));
      },
      'got from cache': function(t){
        assert.isObject(t);
      },
      'correct user': function(t){
        assert.equal(t.dn, 'CN=Test test,OU=Kustoden,OU=102030,OU=Krems,OU=LBS,OU=Schulen,DC=dabeach,DC=lan');
        assert.isArray(t.memberOf);
        assert.notEqual(t.memberOf.indexOf('CN=Keinporn,CN=Users,DC=dabeach,DC=lan'), -1);
      },
      'cache correct': function(t){
        assert.deepEqual(t, core.users['phil']);
      }
    }
  },
  
  'category':{
    topic: function(){
      core.inCategories('http://sex.com/blaa', 'sex.com', ['porn', 'webmail'], _w(this.callback));
    },
    'loaded from Redis':function(t){
      assert.isTrue(t);
    },
    'cached':{
      topic: function(){
        core.inCategories('http://sex.com/blaa', 'sex.com', ['porn', 'webmail'], _w(this.callback));
      },
      'got from cache':function(t){
        assert.isTrue(t);
      },
      'cache correct':function(t){
        assert.isTrue(core.categories['sex.com/blaa']['porn_webmail']);
      },
      '- purge':{
        topic: function(){
          core.purge();
          return true;
        },

        'cache empty':function(){
          assert.deepEqual(core.categories, {});
        },
        
        '- load other':{
          topic: function(){
            core.inCategories('http://sex.com/other', 'sex.com', ['porn', 'webmail'], _w(this.callback));
          },
          
          '- load again and purge':{
            topic: function(){
              core.inCategories('http://sex.com/blaa', 'sex.com', ['porn', 'webmail'], _w(this.callback));
              core.purge();
            },

            'got result':function(t){
              assert.isTrue(t);
            },

            'cache has new results':function(){
              assert.deepEqual(core.categories, {'sex.com/blaa': { 'porn_webmail': true }});
            }
          }
          
        }
      }
    }
  }
}).exportTo(module);