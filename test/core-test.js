var vows    = require('vows');
var assert  = require('assert');
var Core    = require('../lib/core');

var core = new Core({
  redirect: 'default_redirect.com'
});

core.addRule({
  name: 'default_rule',
  redirect: 'localhost/deny?domain=[domain]&user=[user]&rule=[name]'
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
    },
    
    'Url placeholders':{
      topic: function(){
        core.isAllowed({domain:'google.com', user: 'phil'}, _w(this.callback));
      },
      
      'are replaced with values': function(t){
        assert.equal(t, 'localhost/deny?domain=google.com&user=phil&rule=default_rule');
      }
    }
    
  }
}).exportTo(module);