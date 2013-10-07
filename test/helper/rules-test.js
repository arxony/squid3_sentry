var should = require('should');

var Class = require('../../lib/helper/rules');

describe('RulesHelper', function(){  
  
  describe('#isAllowed()', function(){
    describe('without rules', function(){
      var helper = new Class(sentry, {});
      it('returns true', function(done){
        helper.isAllowed({}, function(result){
          result.should.be.true;
          done();
        });
      });
    });
    
    describe('with one denying rule', function(){
      var helper = new Class(sentry, [{
        match: 'foo'
      }]);
      
      it('returns false', function(done){
        helper.isAllowed({url:'http://foo.com'}, function(result){
          result.should.be.false;
          done();
        });
      });
    });
    
    
    describe('with multiple rules', function(){
      var helper = new Class(sentry, [{
        match: 'bar'
      },{
        match: 'foo'
      }]);
      
      it('returns false and the matching rule', function(done){
        helper.isAllowed({url:'http://foo.com'}, function(result, rule){
          result.should.be.false;
          rule.should.have.property('name', 'rule1');
          done();
        });
      });
    });
    
    
    describe('with multiple rules and redirect', function(){
      var helper = new Class(sentry, [{
        match: 'bar'
      },{
        match: 'foo',
        redirect: 'http://bar.com'
      }]);
      
      it('returns false and the right rediret url', function(done){
        helper.isAllowed({url:'http://foo.com'}, function(result, rule, redirect){
          result.should.be.false;
          redirect.should.be.equal('http://bar.com')
          done();
        });
      });
    });
    
  }); 
  
  describe('#add()', function(){
    describe('add one denying rule', function(){
      var helper = new Class(sentry, [{
        match: 'bar'
      }]);
      
      helper.add({
        matches: 'foo'
      });
      
      it('returns false', function(done){
        helper.isAllowed({url:'http://foo.com'}, function(result){
          result.should.be.false;
          done();
        });
      });
    });
  });
  
  describe('#remove()', function(){
    describe('remove one denying rule', function(){
      var helper = new Class(sentry, [{
        matches: 'foo'
      },{
        match: 'bar'
      }]);
            
      helper.remove(0);
            
      it('returns true', function(done){
        helper.isAllowed({url:'http://foo.com'}, function(result){
          result.should.be.true;
          done();
        });
      });
    });
  });
  
  describe('#removeAll()', function(){
    describe('remove one denying rule', function(){
      var helper = new Class(sentry, [{
        matches: '.*'
      },{
        match: 'foo'
      }]);
            
      helper.removeAll();
            
      it('returns true', function(done){
        helper.isAllowed({url:'http://foo.com'}, function(result){
          result.should.be.true;
          done();
        });
      });
    });
  });
  
});