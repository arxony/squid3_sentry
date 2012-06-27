var Core = require('../lib/core');
var Squid = require('../lib/squid');
var core = new Core({
  redirect: 'default_redirect.com',
  ldap:{
    url: 'ldap://10.20.30.66:389',
    dn: 'CN=ldap_auth,CN=Users,DC=dabeach,DC=lan',
    password: 'ooDahs0i',
    base: 'DC=dabeach,DC=lan'
  }
});

Squid.core = core;

core.addRule({
  name: 'filetype',
  allow: false,
  filetypes: ['swf', 'fla', 'flv'],
  redirect: 'no-flash.com'
});

core.addRule({
  name: 'a',
  allow: false,
  matches: ['*.a-team.at', 'a-team.at'],
  redirect: 'aaa.com'
});

core.addRule({
  name: 'b',
  allow: false,
  categories: ['porn', 'spyware', 'test', 'sex_lingerie', 'sex_education'],
  groups: ['CN=Keinporn,CN=Users,DC=dabeach,DC=lan'],
  redirect: 'no-porn.com'
});

core.addRule({
  name: 'c',
  allow: false,
  matches: ['*.c-team.at', 'a-team.at'],
  redirect: 'c-redirect'
});

core.addRule({
  name: 'default',
  allow: false,
  redirect: 'specific-time.com',
  times: [{from:'16:30', to:'24:00'}]
});


function test(urls){  
  
  var start = new Date().getTime();
  var unfinished = urls.length;
  
  for(var i in urls){
    Squid.parse(urls[i], function(r){

      unfinished--;

      if(unfinished == 0){
        var end = new Date().getTime();
        var time = end - start;
        console.log('Finished ' + urls.length + ' requests in ' + (time/1000) + 's');
        process.exit(0);
      }
    });
  }

}



test([
	'0 http://www.s-team.at/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'1 http://www.a-team.at/ 10.20.30.67/- andre GET myip=10.20.30.70 myport=8080',
	'2 http://orf.at/ 10.20.30.67/- hans GET myip=10.20.30.70 myport=8080',
	'31 http://sexualhost.com/a/b/d?test=33 10.20.30.67/- hugo GET myip=10.20.30.70 myport=8080',
	'32 http://sexualhost.com/player.swf?_dc=2342342354534 10.20.30.67/- felix GET myip=10.20.30.70 myport=8080',
	'33 http://sexualhost.com/video.flv?_dc=2342342354534 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'1 http://www.s-team.at/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'2 http://www.s-team.at/modules/mod_jflanguageselection/tmpl/mod_jflanguageselection.css 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'3 http://www.s-team.at/templates/s-team/css/template.css 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'4 http://www.s-team.at/media/system/js/mootools.js 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'5 http://www.s-team.at/media/system/js/caption.js 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/templates/system/css/system.css 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/templates/s-team/images/head_bg.png 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/images/stories/phone_seperator.jpg 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/images/stories/teaser/iphone.jpg 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/templates/s-team/images/arrow_right_blue.png 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/images/stories/teaser/apple_app_store.png 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/templates/s-team/images/foot_bg.png 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.google-analytics.com/ga.js 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/images/stories/footer/random/hundertwasser2.jpg 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.teamviewer.com/link/?url=426717&id=1594183991 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.s-team.at/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://www.google-analytics.com/ga.js 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://wallpapers.lookscool.com/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://128.242.183.210/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://thumbsremote.com/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://128.242.183.211/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://xxx-pictures-xxx.net/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080',
	'0 http://128.242.183.219/ 10.20.30.67/- phil GET myip=10.20.30.70 myport=8080'	
]);
