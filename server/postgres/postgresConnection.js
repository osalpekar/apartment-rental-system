var pg = require('pg');
var conString = process.env.postgresURL;

var client = new pg.Client(conString);
client.connect();

module.exports = client;

