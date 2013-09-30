var should = require('should');

var Class = require('../../lib2/types/category');

describe('Category', function(){
  isUsedHelper(Class, ['category', 'categories'], ['foo', 'bar']);
  
  
  /**
   *        'foo': ['foo.com'],
   *        'bar': ['domain.com', 'foo.other.com']
   */
  
  describe('#filter()', function(){  
    filterHelper(Class, {category: 'foo'},            {url: 'http://foo.com/'},                   true);
    filterHelper(Class, {categories: ['bar', 'foo']}, {url: 'http://foo.com/folder'},             true);
    filterHelper(Class, {category: 'foo'},            {url: 'http://sub.foo.com/folder'},         true);
    filterHelper(Class, {category: 'bar'},            {url: 'http://foo.other.com'},              true);
    filterHelper(Class, {category: 'foo'},            {url: 'http://foo.com/?redirect=bar.com'},  true);
    filterHelper(Class, {category: 'foo'},            {url: 'http://bar.com/?redirect=foo.com'},  false);
    filterHelper(Class, {category: 'bar'},            {url: 'http://foo.com/?redirect=bar.com'},  false);
    filterHelper(Class, {category: 'bar'},            {url: 'http://other.com'},                  false);
    filterHelper(Class, {category: ['bar', 'bla']},   {url: 'http://foo.com/file.exe'},           false);
  });
});