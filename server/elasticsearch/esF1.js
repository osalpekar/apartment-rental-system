var client = require('./esConnection.js')

var createIndex = function (indexName) {
    client.indices.create({
        index: indexName
    }, function(err, resp) {
        if(err) {
            console.log(err);
        } else {
            console.log("create", resp);
        }
    });
}

var deleteIndex = function (indexName) {
    client.indices.delete({
        index: indexName
    }, function(err, resp) {
      console.log("delete", resp);
    });
}

var insertItem = function (indexName, itemObject) {
    client.index({
        index: indexName,
        type: 'items',
        body: itemObject
    }, function(err, resp) {
        console.log(resp);
    });
}

var search = function (indexName, matchObject) {
    client.search({
        index: indexName,
        type: 'items',
        body: {
            query: {
                match: {
                    text: matchObject
                }
            },
        }
    }, function (error, response, status) {
        if (error){
            console.log("search error: "+error)
        } else {
            return response;
            // console.log("--- Response ---");
            // console.log(response);
            // console.log("--- Hits ---");
            // response.hits.hits.forEach(function(hit){
            //     console.log(hit);
            // })
        }
    });
}

var ping = function () {
    client.ping({
    // ping usually has a 3000ms timeout
        requestTimeout: 1000
    }, function (error) {
        if (error) {
            console.trace('elasticsearch cluster is down!');
        } else {
            console.log('All is well');
        }
    });
}

module.exports = {
    createIndex: createIndex,
    deleteIndex: deleteIndex,
    insertItem: insertItem,
    search: search,
    ping: ping
}
