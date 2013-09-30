var should = require('should');
var fs     = require('fs');


var Class = require('../../lib2/helper/redis');

describe('RedisHelper', function(){  
  var helper = new Class(sentry, {
    fake: true,
    db: {
      category: ['item1', 'item2', 'foo', 'bar']
    }
  });
  
  describe('#readDomainsFromFile()', function(){
    it('loads all the file content into redis', function(done){
      helper.readDomainsFromFile('test/blocklists/foo.txt', 'mycategory', {watch: true}, function(){
        helper.client.smembers(helper.prefix + ':category:mycategory', function(err, members){
          should.not.exist(err);
          members.sort().should.be.eql(['foo.com', 'bar.com'].sort());
          done();
        });     
      });
    });
    
    
    fs.writeFileSync('test/blocklists/bar.txt', 'bar.com\n');
    
    it('reloads the file if it changes', function(done){
      helper.readDomainsFromFile('test/blocklists/bar.txt', 'bar', {watch: true}, function(){
        fs.appendFileSync('test/blocklists/bar.txt', 'blubb.com\n');
        
        //wait for the reload
        setTimeout(function(){
          helper.client.smembers(helper.prefix + ':category:bar', function(err, members){
            should.not.exist(err);
            members.sort().should.be.eql(['bar.com', 'blubb.com'].sort());
            done();
          });
        }, 100);
             
      });
    });
    
  });
  
  
});