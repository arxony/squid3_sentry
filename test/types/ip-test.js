var should = require('should');

var Class = require('../../lib/types/ip');

describe('IP', function(){
  isUsedHelper(Class, ['ip', 'ips'], ['10.20.30.40', '192.168.0.1']);
  
  describe('#filter()', function(){  
    filterHelper(Class, {ip: '192.168.0.11'},                                 {ip: '192.168.0.11'}, true);
    filterHelper(Class, {ips: ['10.20.30.40', '192.168.0.11']},               {ip: '192.168.0.11'}, true);
    filterHelper(Class, {ip: '192.168.0.0/24'},                               {ip: '192.168.0.11'}, true);
    filterHelper(Class, {ip: '192.168.0.0-192.168.0.20'},                     {ip: '192.168.0.11'}, true);
    filterHelper(Class, {ip: ['10.20.30.0/24', '192.168.0.0/24']},            {ip: '192.168.0.11'}, true);
    filterHelper(Class, {ip: ['10.20.30.0/24', '192.168.0.0-192.168.0.20']},  {ip: '192.168.0.11'}, true);
    
    filterHelper(Class, {ip: '192.168.0.11'},                                 {ip: '192.168.1.11'}, false);
    filterHelper(Class, {ips: ['10.20.30.40', '192.168.0.11']},               {ip: '192.168.1.11'}, false);
    filterHelper(Class, {ip: '192.168.0.0/24'},                               {ip: '192.168.1.11'}, false);
    filterHelper(Class, {ip: '192.168.0.0-192.168.0.20'},                     {ip: '192.168.1.11'}, false);
    filterHelper(Class, {ip: ['10.20.30.0/24', '192.168.0.0/24']},            {ip: '192.168.1.11'}, false);
    filterHelper(Class, {ip: ['10.20.30.0/24', '192.168.0.0-192.168.0.20']},  {ip: '192.168.1.11'}, false);
  });
});