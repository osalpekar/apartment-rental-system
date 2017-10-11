var mysql = require('mysql');

// console.log('mysql connection: ' + process.env.mySQLHost);

var connection = mysql.createConnection({
    host: process.env.mySQLHost,
    user: 'user',
    password: 'runner',
    database: 'my_db'
});

connection.connect(function(err) {
    if (err) throw err;
    console.log('Connected!');

    var sql = "CREATE TABLE people (id primary key auto_increment, text VARCHAR(255))";

    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table created");
    });
});

module.exports = connection;
