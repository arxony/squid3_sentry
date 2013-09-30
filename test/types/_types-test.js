var should = require('should');

global.isUsedHelper = function(Cls, options, values){
  describe('#isUsed()', function(){
    var type = new Cls(sentry, sentry.rules);
    
    describe('yes', function(){
      for(var i in options){
        describe('with `' + options[i] + '`:`' + values[0] + '`', function(){
          tmp = {};
          tmp[options[i]] = values[0];
          var result = type.isUsed(tmp);
    
          it('returns true', function(){
            result.should.be.true;
          });
        });
      
        describe('with `' + options[i] + '`:[' + values + ']', function(){
          tmp = {}
          tmp[options[i]] = values;
          var result = type.isUsed(tmp);
    
          it('returns true', function(){
            result.should.be.true;
          });
        });
      }    
    });
  
    describe('no', function(){
      describe('with empty object', function(){
        var result = type.isUsed({});

        it('returns false', function(){
          result.should.be.false;
        });
      });
    
      describe('with null', function(){
        var result = type.isUsed();

        it('returns false', function(){
          result.should.be.false;
        });
      });
    });
  });
};


global.filterHelper = function(Cls, config, options, matches){
  describe((matches ? '' : "doesn't ") + 'match ' + JSON.stringify(config), function(){
    var type   = new Cls(sentry, sentry.rules);
    var result = type.isUsed(config);

    it('with ' + JSON.stringify(options), function(done){
      type.filter(options, function(err){
        result.should.be.true;
        if(matches){
          should.not.exist(err);
        }else{
          should.exist(err);
        }          
        done();
      });
    });
  });
};