var should = require('should');
var fs     = require('fs');


var Class = require('../../lib2/types/category_file');

describe('CategoryFile', function(){  
  isUsedHelper(Class, ['category_file', 'category_files'], ['test/blocklists/foo.txt', 'bar.txt']);
  
  
  describe('#filter()', function(){  
    filterHelper(Class, {category_file: 'test/blocklists/foo.txt'}, {url: 'http://foo.com/'}, true);
    filterHelper(Class, {category_file: 'test/blocklists/nonexisting.txt'}, {url: 'http://foo.com/'}, false);
  });  
  
});