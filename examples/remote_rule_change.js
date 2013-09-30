var faye = require('faye');

var server = new faye.NodeAdapter({
  engine: {
    type: require('faye-redis'),
    host: 'localhost',
    port: null,
    password: null,
    database: '0',
    namespace: "sentry:faye:"
  },
  mount: '/'
});

var client = server.getClient();


var publication = client.publish('/sentry', {
  action: 'cache:clear'
});

publication.callback(function() {
  console.log('[PUBLISH SUCCEEDED]');
});
publication.errback(function(error) {
  console.log('[PUBLISH FAILED]', error);
});
