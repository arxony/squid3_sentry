var should = require('should');

var Class = require('../../lib/types/user');

describe('User', function(){
  isUsedHelper(Class, ['user', 'users'], ['phil', 'michl']);
  
  describe('#filter()', function(){  
    filterHelper(Class, {user: 'phil'},             {username: 'phil'}, true);
    filterHelper(Class, {users: ['michl', 'phil']}, {username: 'phil'}, true);
    filterHelper(Class, {user: 'phil'},             {username: 'Phil'}, true);
    filterHelper(Class, {user: 'phil'},             {username: ''},     false);
    filterHelper(Class, {user: ['michl', 'phil']},  {username: 'mark'}, false);
  });
});