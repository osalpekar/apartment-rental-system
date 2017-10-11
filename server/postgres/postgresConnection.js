var pg = require('pg');
var conString = process.env.postgresURL;

var client = new pg.Client(conString);
client.connect();

const query = client.query(
  'CREATE TABLE items(id SERIAL PRIMARY KEY, text VARCHAR(40) not null, complete BOOLEAN)');
query.on('end', () => { client.end(); });

module.exports = client;

