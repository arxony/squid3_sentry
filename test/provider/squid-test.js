var should = require('should');

var Class = require('../../lib/provider/squid');

describe('Squid Provider', function(){  
  var provider = new Class({});
  
  sentry.rules.add({
    redirect: 'no-foo.com',
    matches: 'foo.com'
  });
  
  provider.use(sentry);
  
  describe('#parse()', function(){
    
    it('returns a valid squid response', function(){
      provider.parse('2 http://foobar.com 10.20.30.40/- phil GET ', function(result){
        result.should.be.equal('2');
      });
    });
    
    
    it('returns a valid squid response although the input is invalid', function(){
      provider.parse('3 some-quirk', function(result){
        result.should.be.equal('3');
      });
    });
    
    
    it('returns a valid redirect squid response', function(){
      provider.parse('4 http://foo.com 10.20.30.40/- phil GET ', function(result){
        result.should.be.equal('4 http://no-foo.com');
      });
    });
  });
  
});