var mysql = require('mysql');

console.log('mysql connection: ' + process.env.mySQLHost);

var connection = mysql.createConnection({
  host: process.env.mySQLHost,
  user: 'user',
  password: 'runner',
  database: 'my_db'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected!');
});

module.exports = connection;
