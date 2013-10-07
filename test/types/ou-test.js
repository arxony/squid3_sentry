var should = require('should');

var Class = require('../../lib/types/ou');

describe('OU', function(){
  isUsedHelper(Class, ['ou', 'ous'], ['ou=test,dc=sentry,dc=local', 'ou=user,dc=sentry,dc=local']);
  
  describe('#filter()', function(){  
    filterHelper(Class, {ou: 'ou=users, dc=sentry, dc=local'},                                  {username: 'phil'}, true);
    filterHelper(Class, {ou: 'ou=users,dc=sentry,dc=local'},                                    {username: 'phil'}, true);
    filterHelper(Class, {ou: 'OU=users, DC=sentry, DC=local'},                                  {username: 'phil'}, true);
    filterHelper(Class, {ou: 'OU=users,DC=sentry,DC=local'},                                    {username: 'phil'}, true);
    filterHelper(Class, {ou: 'DC=sentry,DC=local'},                                             {username: 'phil'}, true);
    filterHelper(Class, {ous: ['OU=other,DC=sentry,DC=local', 'OU=users,DC=sentry,DC=local']},  {username: 'phil'}, true);
    
    filterHelper(Class, {ou: 'OU=other,DC=sentry,DC=local'},                                    {username: 'Phil'}, false);
    filterHelper(Class, {ou: 'OU=users,DC=sentry,DC=local'},                                    {username: ''},     false);
    filterHelper(Class, {ou: ['OU=other,DC=sentry,DC=local', 'OU=users,DC=sentry,DC=local']},   {username: 'mark'}, false);
  });
});