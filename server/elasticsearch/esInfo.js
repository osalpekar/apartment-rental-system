var client = require('./esConnection.js');

client.cluster.health({},function(err,resp,status) {  
  console.log("-- Client Health --",resp);
});
