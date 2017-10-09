var pg = require('pg');
var conString = "postgres://postgres:5432/YourDatabase";

var client = new pg.Client(conString);
client.connect();

module.exports = client;

