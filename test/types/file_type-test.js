var should = require('should');

var Class = require('../../lib/types/file_type');

describe('FileType', function(){
  isUsedHelper(Class, ['file_type', 'file_types'], ['pdf', 'exe']);
  
  describe('#filter()', function(){  
    filterHelper(Class, {file_type: 'exe'},           {url: 'http://domain.com/file.exe'},                true);
    filterHelper(Class, {file_types: ['pdf', 'exe']}, {url: 'http://domain.com/file.exe'},                true);
    filterHelper(Class, {file_type: 'exe'},           {url: 'http://domain.com/file.exe?foo=bar'},        true);
    filterHelper(Class, {file_type: 'pdf'},           {url: 'http://domain.com/file.exe?type=pdf'},       false);
    filterHelper(Class, {file_type: 'png'},           {url: 'http://domain.com/file.jpg?name=test.png'},  false);
    filterHelper(Class, {file_type: ['png', 'jpg']},  {url: 'http://domain.com/file.exe'},                false);
  });
});