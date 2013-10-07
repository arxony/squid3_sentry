var should = require('should');

var Class = require('../../lib/helper/cache');

describe('CacheHelper', function(){  
  var helper = new Class(sentry, {});
  
  describe('#set()', function(){
    helper.set('key', 'value');
    it('the value was set', function(){
      helper.get('key', function(value){
        value.should.be.equal('value');
      });
    });
    
    helper.set(['key', 'subkey'], 'value2');
    it('the value was set with a complex key', function(){
      helper.get(['key', 'subkey'], function(value){
        value.should.be.equal('value2');
      });
    });
  });
  
  
  describe('#exists()', function(){
    helper.set('key', 'value');
    it('the value exists', function(){
      helper.exists('key').should.be.true;
    });
    
    helper.set(['key', 'subkey'], 'value2');
    it('the value exists with a complex key', function(){
      helper.exists(['key', 'subkey']).should.be.true;
    });
  });
  
  
  describe('#lock()', function(){
    helper.lock('key2');
    var set = false;
    
    it('returns the value after #set()', function(done){
      helper.get('key2', function(value){
        value.should.be.equal('value');
        set.should.be.true;
        done();
      });
      
      process.nextTick(function(){
        set = true;
        helper.set('key2', 'value');      
      });
      
    });            
  }); 
  
  
  describe('#clear()', function(){
    var helper = new Class(sentry, {});
    helper.set('key', 'value');
    
    helper.clear();
    it('returns null', function(done){
      helper.get('key', function(value){
        should.not.exists(value);
        done();
      });      
    });
  
  }); 
  
});