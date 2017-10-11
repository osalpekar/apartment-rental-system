var express = require('express');
var app = express();
var mongoose = require('mongoose');
var mysql = require('./mysql/mySqlFunctions.js');
var elasticsearch = require('./elasticsearch/esFunctions.js');
var postgres = require('./postgres/postgresConnection.js');
// const router = express.Router();
const path = require('path');

console.log(process.env.mySQLHost);
const PORT_NUMBER = 3000;

// mongoose.connect('mongodb://mongo.q/tenantData');

app.use(express.static(__dirname + 'client/'));
app.use('/scripts', express.static(__dirname + 'node_modules/'));

// The 5 endpoints are defined below 

app.get('/app/users', function(req, res) {
    res.send('Welcome to the nultiservice application!');
});

app.get('/app/psql/users', function(req, res, next) {
    const results = [];
    const query = postgres.query('SELECT * FROM items ORDER BY id ASC;');
    
    query.on('row', function(row) {
        results.push(row);
    });
    
    query.on('end', function() {
        done();
        return res.json(results);
    });
});

app.post('/app/psql/users', function(req, res, next) {
    const results = [];
    const data = {text: req.body.text};
    postgres.query('INSERT INTO items(text) values($1)', [data.text]);
    const query = postgres.query('SELECT * FROM items ORDER BY id ASC');

    query.on('row', function(row) {
        results.push(row);
    });

    query.on('end', function() {
        done();
        return res.json(results);
    });
});

app.get('/app/mysql/users', function(req, res, next) {
    const query = 'SELECT * FROM people';

    mysql.query(query, function(err, result, fields) {
        if (err) throw err;
        return res.json(result);
    });
});

app.post('/app/mysql/users', function(req, res, next) {
    const data = {text: req.body.text};
    const query = "INSERT INTO people (text) VALUES ('$1')", [data.text];

    mysql.query(query, function(err, result, fields) {
        if (err) throw err;
        return res.json(result);
    });
});

app.listen(PORT_NUMBER);
console.log('Navigate to http://localhost:3000/app/users');
