var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client( {  
  hosts: [
     process.env.elasticURL
  ]
});

module.exports = client;  
