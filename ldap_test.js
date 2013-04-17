var LDAP = require('./lib/sources/ldap');
var ldap = new LDAP({
  url: "ldap://ad03.noeb.local:389",
  dn: "cn=squid_auth,cn=Users,dc=noeb,dc=local",
  password: "ooDahs0i",
  base: "DC=noeb,DC=local"
});
/*
var ldap = new LDAP({
  url: "ldap://10.20.30.68:389",
  dn: "cn=admin,dc=heime,dc=lan",
  password: "peeshe9U",
  base: "DC=heime,DC=lan",
  ldap_type:'openLdap'
});
*/


//"(&(sAMAccountName=erdbergTest2)(memberOf:1.2.840.113556.1.4.1941:=CN=316131_Kustoden,OU=Kustoden,OU=HS1,OU=Erdberg,OU=Test-Schule,DC=noeb,DC=local))",
ldap.isMemberOfGroups('erdbergTest', ['CN=316131_Kustoden,OU=Kustoden,OU=HS1,OU=Erdberg,OU=Test-Schule,DC=noeb,DC=local', 'cn=Hinterbrühl_Kustoden,ou=Kustoden,ou=Hinterbrühl,dc=heime,dc=lan'], function(in_group, dn){
  console.log('EE', in_group, dn);
});

//1 http://www.sex.com/ 10.20.30.40/- kusto1 GET 
//1 http://www.chat.com/ 10.20.30.40/- Adis.Hasani GET 
//1 http://static.ak.fbcdn.net/ 10.20.30.40/- Adis.Hasani GET 
