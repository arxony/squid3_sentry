var vows    = require('vows');
var assert  = require('assert');
var Core    = require('../lib/core');

var core = new Core({
  redirect: 'default_redirect.com'
});


var _w = vows._w;

vows.describe('Core').addBatch({
  'Core':{
    topic: function(){
      return Core;
    },
    'is a class': function(t){
      assert.isFunction(t);
    },
    'has a getSharedInstance method': function(t){
      assert.isFunction(t.getSharedInstance);
    },
    'instance':{
      topic: function(){
        return core;
      },
      'has a isAllowed method': function(t){
        assert.isFunction(t.isAllowed);
      },
      'has a addRule method': function(t){
        assert.isFunction(t.addRule);
      },
      'has a addRuleDefinition method': function(t){
        assert.isFunction(t.addRuleDefinition);
      },
      'is the same as the shared instance': function(t){
        assert.deepEqual(t, Core.getSharedInstance());
      }
    }
    
  }
}).exportTo(module);