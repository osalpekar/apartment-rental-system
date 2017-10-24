var clientCreate = require('./esConnection.js');

var client = clientCreate();
while (!ping()) {
    client = clientCreate();
}

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
    return client.search({
        index: indexName,
        type: 'items',
        body: {
            query: {
                match: {
                    text: matchObject
                }
            },
        }
    })
    // .then(function(result) {
    //     res.json(result)
    // });

    // }, function (error, response, status) {
    //     if (error){
    //         console.log("search error: "+error)
    //     } else {
    //         console.log(response)
    //         return response;
    //         // console.log("--- Response ---");
    //         // console.log(response);
    //         // console.log("--- Hits ---");
    //         // response.hits.hits.forEach(function(hit){
    //         //     console.log(hit);
    //         // })
    //     }
    // });
}

var ping = function () {
    client.ping({
    // ping usually has a 3000ms timeout
        requestTimeout: 1000
    }, function (error) {
        if (error) {
            console.trace('elasticsearch cluster is down!');
            return false;
        } else {
            console.log('All is well');
            return true;
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
