var Sentry = require('../lib2');


global.sentry = new Sentry({
  redis:{
    in_memory: true,
    db:{
      'foo': ['foo.com'],
      'bar': ['domain.com', 'foo.other.com']
    }
  },
  ldap:{
    in_memory: true,
    db: {
      'cn=phil, ou=users, dc=sentry, dc=local' :{
        uid: 'phil',
        memberof: 'cn=group, dc=sentry, dc=local'
      },
      'cn=michl, ou=users, dc=sentry, dc=local' :{
        uid: 'michl',
        memberof: ''
      },
      'cn=group, dc=sentry, dc=local':{
        members: ['cn=phil, ou=users, dc=sentry, dc=local']
      }
    }
  }
});