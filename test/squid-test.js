var vows    = require('vows');
var assert  = require('assert');
var Squid   = require('../lib/squid');
var Core    = require('../lib/core');

var core = Core.getSharedInstance();
Squid.core = core;

var _w = vows._w;

vows.describe('Squid').addBatch({
  'Squid parser in re-write mode':{    
    topic: function(){
      core.addRule({
        name: 'deny all',
        redirect: 'denyall.com',
        mode: 'rewrite'
      }, 0);
      Squid.parse('0 http://www.google.com/ 10.20.30.40/- phil GET ', _w(this.callback));
    },
    'default denied':function(t){
      assert.equal(t, '0 http://denyall.com');
    },
    'add rule: google.com allowed for user "phil"':{
      topic: function(){
        core.addRule({
          name: 'allow for phil',
          allowed: true,
          src_type:'user',
          users:'phil'
        }, 0);
        Squid.parse('1 http://www.google.com/ 10.20.30.40/- phil GET ', _w(this.callback));
      },
      'is allowed for user "phil"':function(t){
        assert.equal('1', t);
      }
    }
  },
  
  'Squid parser in redirect mode':{    
    topic: function(){
      core.addRule({
        name: 'deny all',
        redirect: 'denyall.com'
      }, 0);
      Squid.parse('0 http://www.google.com/ 10.20.30.40/- phil GET ', _w(this.callback));
    },
    'default denied':function(t){
      assert.equal(t, '0 302:http://denyall.com');
    },
    'add rule: google.com allowed for user "phil"':{
      topic: function(){
        core.addRule({
          name: 'allow for phil',
          allowed: true,
          src_type:'user',
          users:'phil'
        }, 0);
        Squid.parse('1 http://www.google.com/ 10.20.30.40/- phil GET ', _w(this.callback));
      },
      'is allowed for user "phil"':function(t){
        assert.equal('1', t);
      }
    }
  }
}).exportTo(module);