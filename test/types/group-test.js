var should = require('should');

var Class = require('../../lib/types/group');

describe('Group', function(){
  isUsedHelper(Class, ['group', 'groups'], ['cn=group1', 'cn=group2']);
    
  describe('#filter()', function(){  
    filterHelper(Class, {group: 'cn=group, dc=sentry, dc=local'},                                 {username: 'phil'},   true);
    filterHelper(Class, {group: 'cn=group,dc=sentry,dc=local'},                                   {username: 'phil'},   true);
    filterHelper(Class, {group: 'CN=group, DC=sentry, DC=local'},                                 {username: 'phil'},   true);
    filterHelper(Class, {group: 'CN=group,DC=sentry,DC=local'},                                   {username: 'phil'},   true);
    filterHelper(Class, {groups: ['CN=other,DC=sentry,DC=local', 'CN=group,DC=sentry,DC=local']}, {username: 'phil'},   true);
    filterHelper(Class, {groups: ['CN=other,DC=sentry,DC=local', 'CN=group,DC=sentry,DC=local']}, {username: 'Phil'},   true);
                                                                                                                        
    filterHelper(Class, {group: 'CN=group,DC=sentry,DC=local'},                                   {username: ''},       false);
    filterHelper(Class, {group: ['OU=other,DC=sentry,DC=local', 'CN=group,DC=sentry,DC=local']},  {username: 'michl'},  false);
    filterHelper(Class, {group: ['OU=other,DC=sentry,DC=local', 'CN=group,DC=sentry,DC=local']},  {username: 'mark'},   false);
  });
});