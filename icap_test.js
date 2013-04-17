
var net = require('net');
var http = require('http');
var parser = require('./parser');


var options_response = [
'ICAP/1.0 200 OK',
'Methods: REQMOD',
'Service: FOO Tech Server 1.0',
'ISTag: "W3E4R7U9-L2E4-2"',
'Encapsulated: null-body=0',
'Max-Connections: 1000',
'Options-TTL: 7200',
'Allow: 204',
'Preview: 2048',
'Transfer-Complete: asp, bat, exe, com',
'Transfer-Ignore: html',
'Transfer-Preview: *',
'',
''
].join("\n");

var reqmod_response = [
'ICAP/1.0 200 OK',
'Server: ICAP-Server-Software/1.0',
'Connection: keep-alive',
'ISTag: "W3E4R7U9-L2E4-2"',
'Encapsulated: res-hdr=0, res-body=<body_lenght>',
''
].join("\n");

var server = net.createServer(function(c) { //'connection' listener
  console.log('client connected');
  c.on('end', function() {
    console.log('client disconnected');
  });
  
  c.on('data', function(data) {
    var tmp = data.toString();
    tmp = tmp.replace('REQMOD', 'GET');
    tmp = tmp.replace('RESPMOD', 'POST');
    if(!tmp.match(/^OPTIONS/)) tmp = tmp.replace('ICAP\/1.0', "ICAP/1.0\nContent-Length: 1");
    tmp = tmp.replace('ICAP', 'HTTP');
    
    tmp = parser.parse(tmp);
    if(tmp.body) tmp.body = parser.parse(tmp.body);
        
    console.log('R', tmp);
    
    console.log('-------------');
    console.log(data.slice(178).toString().length);
    console.log('-------------');
    
    switch(tmp.method){
      case 'OPTIONS':
        c.write(options_response);
      break;
      
      case 'GET':
      
        var a = new http.ServerResponse({});
        var body = "ICAP says: NO " + tmp.body.url;
        
        if(tmp.body.url.match(/\.google\./)){
          a.writeHead(302, {
            'Location': tmp.body.url.replace('google', 'antigoogle')
            //add other headers here...
          });
          a.end();
          
          var r = reqmod_response + "\n" + a.output.join("\n") + "\n";
          
                    
          console.log(r);
          c.write(r);
          
        }else{
          a.writeHead(200, {
            'Content-Length': body.length+1,
            'Content-Type': 'text/plain' }
          );
          a.write("68\n" + body);
          a.end();
          
          var r = reqmod_response + "\n" + a.output.join("\n") + "\n0\n";
          r = r.replace('<body_lenght>', a._header.length);
          
          console.log('--', a._header, '--');
          
          console.log(r);
          c.write(r);
        }
      break;
      
      default:
        console.log("====?REQUEST?====\n", data.toString());
        c.write('ICAP/1.0 404 OK');
      break;
    }
    
  });
  
  
  //c.write('hello\r\n');
  //c.pipe(c);
});
server.listen(1344, function() { //'listening' listener
  console.log('server bound');
});


/*

var util = require('util');

var a = [
'HTTP/1.1 200 OK',
'Date: Mon, 19 Jul 2004 16:18:20 GMT',
'Server: Apache',
'Last-Modified: Sat, 10 Jul 2004 17:29:19 GMT',
'ETag: "1d0325-2470-40f0276f"',
'Content-Length: 9',
'Connection: close',
'Content-Type: text/plain',
'',
'{"hey":5}'
].join("\n");

a = [
'POST /path/script.cgi HTTP/1.0',
'From: frog@jmarshall.com',
'User-Agent: HTTPTool/1.0',
'Content-Type: application/x-www-form-urlencoded',
'Content-Length: 32',
'',
'home=Cosby&favorite+flavor=flies',
''
].join("\n");

a = [
'REQMOD icap://10.20.30.144:1344/request ICAP/1.0',
'Host: 10.20.30.144:1344',
'Date: Mon, 15 Apr 2013 12:22:01 GMT',
'Encapsulated: req-hdr=0, null-body=158',
'Preview: 0',
'Allow: 204',
'',
'GET http://google.com/ HTTP/1.1',
'User-Agent: curl/7.24.0 (x86_64-apple-darwin12.0) libcurl/7.24.0 OpenSSL/0.9.8r zlib/1.2.5',
'Host: google.com',
'',
''
].join("\n").replace('REQMOD', 'GET').replace('ICAP', 'HTTP').replace(/(Host: .+\n)/, "$1Content-Length: 1\n");


var x = parser.parse(a, 'request');
console.log(util.inspect(x, true, 3, true));

*/