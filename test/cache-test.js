var vows = require('vows');
var assert = require('assert');

var Cache = require('../lib/cache');
var Rule = require('../lib/rule');

var cache = new Cache({
  redirect: 'chache-test.default.com',
  ldap:{
    url: 'ldap://10.20.30.66:389',
    dn: 'CN=ldap_auth,CN=Users,DC=dabeach,DC=lan',
    password: 'ooDahs0i',
    base: 'DC=dabeach,DC=lan'
  }
});

cache.addRuleDefinition(require('../lib/rules/category'));
cache.addRuleDefinition(require('../lib/rules/group'));


vows._cache = cache;

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
      cache.getUser('phil', _w(this.callback));
    },
    'loaded from LDAP': function(t){
      assert.isObject(t);
    },
    'correct user': function(t){
      assert.equal(t.dn, 'CN=Test test,OU=LBS,OU=Schulen,DC=dabeach,DC=lan');
      assert.isArray(t.memberOf);
      assert.notEqual(t.memberOf.indexOf('CN=Keinporn,CN=Users,DC=dabeach,DC=lan'), -1);
    },
    'cached':{
      topic: function(){
        cache.getUser('phil', _w(this.callback));
      },
      'got from cache': function(t){
        assert.isObject(t);
      },
      'correct user': function(t){
        assert.equal(t.dn, 'CN=Test test,OU=LBS,OU=Schulen,DC=dabeach,DC=lan');
        assert.isArray(t.memberOf);
        assert.notEqual(t.memberOf.indexOf('CN=Keinporn,CN=Users,DC=dabeach,DC=lan'), -1);
      },
      'cache corrent': function(t){
        assert.deepEqual(t, cache.users['phil']);
      }
    }
  },
  
  'category':{
    topic: function(){
      cache.domainInCategories('sex.com', ['porn', 'webmail'], _w(this.callback));
    },
    'loaded from Redis':function(t){
      assert.isTrue(t);
    },
    'cached':{
      topic: function(){
        cache.domainInCategories('sex.com', ['porn', 'webmail'], _w(this.callback));
      },
      'got from cache':function(t){
        assert.isTrue(t);
      },
      'cache correct':function(t){
        assert.isTrue(cache.categories['sex.com']['porn_webmail']);
      }
    }  
  }
}).exportTo(module);