var mysql = require('mysql');

var connection = mysql.createConnection({
  host: process.env.mySQLHost,
  // user: 'user',
  password: 'password',
  database: 'database name'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected!');
});

module.exports = connection;
