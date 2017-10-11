var express = require('express');
var app = express();
var mongoose = require('mongoose');
var mysql = require('./mysql/mySqlFunctions.js');
var elasticsearch = require('./elasticsearch/esFunctions.js');
var postgres = require('./postgres/postgresConnection.js');
// const router = express.Router();
const pg = require('pg');
const path = require('path');

console.log(process.env.mySQLHost);
const PORT_NUMBER = 3000;

// mongoose.connect('mongodb://mongo.q/tenantData');

app.use(express.static(__dirname + 'client/'));
app.use('/scripts', express.static(__dirname + 'node_modules/'));

app.get('/app/users', function(req, res) {
    res.send('hip');
});

app.get('/app/psql/users', function(req, res, next) {
  const results = [];
  pg.connect(connectionString, function(err, client, done) {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query('SELECT * FROM items ORDER BY id ASC;');
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

app.post('/app/psql/users', function(req, res, next) {
  const results = [];
  const data = {text: req.body.text, complete: false};
  pg.connect(connectionString, function(err, client, done) {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('INSERT INTO items(text, complete) values($1, $2)', [data.text, data.complete]);
    const query = client.query('SELECT * FROM items ORDER BY id ASC');
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

// MORE ROUTES FOR ELASTICSEARCH-RELATED FUNCTIONS
// NEED A CATCHALL
app.listen(PORT_NUMBER);
console.log('Navigate to http://localhost:3000/app/users');
