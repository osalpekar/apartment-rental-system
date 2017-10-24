var express = require('express');
var app = express();
var mongoose = require('mongoose');
var mysql = require('./mysql/mySqlConnection.js');
var elasticsearch = require('./elasticsearch/esF1.js');
var postgres = require('./postgres/postgresConnection.js');
var count1 = 0;
// const router = express.Router();
const path = require('path');

console.log(process.env.mySQLHost);
const PORT_NUMBER = 3000;

// mongoose.connect('mongodb://mongo.q/tenantData');

app.use(express.static(__dirname + 'client/'));
app.use('/scripts', express.static(__dirname + 'node_modules/'));
elasticsearch.createIndex('items');

// The 5 endpoints are defined below

app.get('/app/users', function(req, res) {
    res.send('Welcome to the multiservice application!');
});

app.get('/app/psql/users', function(req, res, next) {
    const results = [];
    const query = postgres.query('SELECT * FROM items ORDER BY id ASC');

    query.on('row', function(row) {
        results.push(row);
    });

    query.on('end', function() {
        return res.json(results);
    });

    query.on('error', (err) => {
        console.error(err.stack)
    })
});

app.post('/app/psql/users', function(req, res, next) {
    const results = [];
    // const data = {text: req.body.text};
    postgres.query("INSERT INTO items (text) values('RandomTextFillerTestRandomTextFillerTestRandomTextFillerTestRandomTextFillerTest')");
    const query = postgres.query('SELECT * FROM items ORDER BY id ASC');

    query.on('row', function(row) {
        results.push(row);
    });

    query.on('end', function() {
        return res.json(results);
    });

    query.on('error', (err) => {
        console.error(err.stack)
    })
});

app.delete('/app/psql/users', function(req, res, next) {
    const results = [];
    // const data = {text: req.body.text};
    postgres.query('DELETE FROM items');
    const query = postgres.query('SELECT * FROM items ORDER BY id ASC');

    query.on('row', function(row) {
        results.push(row);
    });

    query.on('end', function() {
        return res.json(results);
    });

    query.on('error', (err) => {
        console.error(err.stack)
    })
});

app.get('/app/mysql/users', function(req, res, next) {
    const query = 'SELECT * FROM people';

    mysql.query(query, function(err, result, fields) {
        if (err) throw err;
        return res.json(result);
    });
});

app.post('/app/mysql/users', function(req, res, next) {
    // const data = {text: req.body.text};
    // const query = "INSERT INTO people (text) VALUES ('$1')", [data.text];
    const query = "INSERT INTO people (text) VALUES ('RandomTextFillerTestRandomTextFillerTestRandomTextFillerTestRandomTextFillerTest')";

    mysql.query(query, function(err, result, fields) {
        if (err) throw err;
        return res.json(result);
    });
});

app.delete('/app/mysql/users', function(req, res, next) {
    // const data = {text: req.body.text};
    const query = "DELETE FROM people";

    mysql.query(query, function(err, result, fields) {
        if (err) throw err;
        return res.json(result);
    });
});

// var contiuneElasticGet = function(req, res, name) {
//     elasticsearch.search('items', name).then(function(result) {
//         if (result.hits.total == 0) {
//             contiuneElasticGet(req, res, name);
//         } else {
//             res.json(result);
//         }
//     });
// }
//
// var responseHitsNone = function(req, res, name) {
//     console.log(name);
//     const query = postgres.query("INSERT INTO items (text) values('" + name + "')");
//     query.on('end', () => {
//     	contiuneElasticGet(req, res, name)
//     })
//     query.on('error', (err) => {
//     	console.error(err.stack)
//     })
// }

var continueElasticGet = function(req, res, name) {
    var count = req.params.count;
    // Generating unused random name
    uname = Math.random().toString(36).substring(7);
    const query = postgres.query("INSERT INTO items (text) values('" + name + "')");
    count1 += 1;
    query.on('end', () => {
        elasticsearch.search('items', name).then(function(result) {
            console.log(result.hits.total);
            if (result.hits.total < parseInt(count)) {
                continueElasticGet(req, res, name);
            } else {
                console.log("END" + count1.toString());
                res.json(result);
            }
        });
    });
}

app.get('/app/elastic/users/:count', function(req, res, next) {
    var count = req.params.count;
    count1 = 0;
    name = Math.random().toString(36).substring(7);
    console.log(name);
    elasticsearch.search('items', name).then(function(result) {
        console.log(result.hits.total);
        if (result.hits.total < parseInt(count)) {
            continueElasticGet(req, res, name);
        } else {
            res.json(result);
        }
    });
});


app.get('/app/elastic/count/:word', function(req, res, next) {
    var name = req.params.word;
    elasticsearch.search('items', name).then(function(result) {
            res.json(result);
    });
    //elasticsearch.ping();
    // esRes = JSON.parse(elasticsearch.search('items', name));
    // if (esRes is true) {
    //     return res.join(elasticsearch.search('items', name));
    // }
    // postgres.query("INSERT INTO items (text) values($1)", [name]);
    // while esRes is still false
    //     esRes = JSON.parse(elasticsearch.search('items', name));
    // return res.json(elasticsearch.search('items', name));
});

app.get('/app/elastic/reset', function(req, res, next) {
    elasticsearch.deleteIndex('items').then(function(result) {
        console.log('Deleted Index');
    });
    elasticsearch.createIndex('items').then(function(result) {
        console.log('Created Index');
    });
});

app.listen(PORT_NUMBER);
// console.log('Navigate to http://localhost:3000/app/users');
