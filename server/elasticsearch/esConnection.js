var elasticsearch = require('elasticsearch');

console.log(process.env.elasticURL);
var client = new elasticsearch.Client({  
  host: process.env.elasticURL
});

module.exports = client;  
