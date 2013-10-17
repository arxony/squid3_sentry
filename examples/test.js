var Sentry = require('../lib');
var sentry = new Sentry({
  redis:{
    in_memory: false,
    host: 'localhost',
    db:{
      'porn': ['blafoo.com', 'blafo2o.com'],
      'bla': ['blafoo.com'],
      'foo': ['blafo2o.com/test']
    }
  },
  log:{
    level: 'debug'
  },
  _ldap:{
    url: 'ldap://10.20.30.71:389',
    dn: 'CN=ldap_auth,CN=Users,DC=dabeach,DC=lan',
    password: 'ooDahs0i',
    base: 'DC=dabeach,DC=lan',
    ldap_type: 'AD'
  },
  ldap:{
    in_memory: true,
    db: {
      'cn=huberhans, ou=test, dc=sentry, dc=local' :{
        uid: 'huberhans',
        memberof: 'cn=group, dc=sentry, dc=local'
      },
      'cn=group, dc=sentry, dc=local':{
        members: ['cn=huberhans, ou=test, dc=sentry, dc=local']
      }
    }
  },
  faye:{
    mount: '/'
  }
});


sentry.rules.add({
  _match: 'foo',  
  categories: ['porn', 'bla', 'foo', 'bar'],
  _ou: 'OU=Test,DC=sentry,DC=local',
  _user: 'huberhans',
  _file_type: 'pdf',
  _group: 'cn=group, dc=sentry, dc=local',
  _ip: ['10.20.0.0/24', '10.20.30.0/24'],
  _time: {year: '2011-2013', week: 38},
  allowed: false,
  redirect: 'Foo.com'
});


sentry.isAllowed({url:'http://blafoo.com/', username:'huberhans', ip:'10.20.30.25'}, function(){
  //console.log(allowed === true ? 'OK' : 'FAILED: ' + allowed);
});

sentry.isAllowed({url:'http://blafo2o.com/test.pdf', username:'huberhans'}, function(){
  //console.log(allowed === true ? 'OK' : 'FAILED: ' + allowed);
});

sentry.isAllowed({url:'http://blsafodo.com/', username:'huberhans', ip:'10.20.0.25'}, function(){
  //console.log(allowed === true ? 'OK' : 'FAILED: ' + allowed);
});