var pg = require('pg');
var conString = process.env.postgresURL;

var client = new pg.Client(conString);
client.connect();

const queryString = 'CREATE TABLE items(id SERIAL PRIMARY KEY, text VARCHAR not null)';
const query = client.query(queryString);
// query.on('end', () => { client.end(); });
query.on('end', () => {
	console.log('Test')
})
query.on('error', (err) => {
	console.log(err.stack)
})

module.exports = client;
