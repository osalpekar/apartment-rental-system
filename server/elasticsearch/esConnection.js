var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client( {  
  hosts: [
     'http://elastic:9200/'
  ]
});

module.exports = client;  
