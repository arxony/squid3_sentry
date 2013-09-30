var should = require('should');

var Class = require('../../lib2/types/match');

describe('MatchType', function(){
  
  isUsedHelper(Class, ['match', 'matches'], ['*foo*', '*bar*']);
  
  describe('#filter()', function(){  
    filterHelper(Class, {match: '*'},                 {url:'http://dafoo.com/'},  true);
    filterHelper(Class, {match: '*foo*'},             {url:'http://dafoo.com/'},  true);
    filterHelper(Class, {matches: '*foo*'},           {url:'http://dafoo.com/'},  true);
    filterHelper(Class, {matches: ['bar', '*foo*']},  {url:'http://dafoo.com/'},  true);
    filterHelper(Class, {match: 'foo'},               {url:'http://dafsoo.com/'}, false);
    filterHelper(Class, {match: '*foo*'},             {url:'http://bar.com/'},    false);
    filterHelper(Class, {match: ['bla', '*foo*']},    {url:'http://bar.com/'},    false);
  });
});