var client = require('./esConnection.js');

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

var insertTenant = function (indexName, tenantObject) {
    client.index({
        index: indexName,
        type: 'tenant',
        body: tenantObject
    }, function(err, resp) {
        console.log(resp);
    });
}

var countTenants = function(indexName) {
    client.count({index: indexName ,type: 'tenant'},function(err,resp,status) {
      console.log("constituencies",resp);
        return(resp);
    });
}

var search = function (indexName, matchObject) {
    client.search({
        index: indexName,
        type: 'tenant',
        body: {
            query: {
                match: matchobject
            },
        }
    }, function (error, response,status) {
        if (error){
            console.log("search error: "+error)
        } else {
            console.log("--- Response ---");
            console.log(response);
            console.log("--- Hits ---");
            response.hits.hits.forEach(function(hit){
                console.log(hit);
            })
        }
    });
}

module.exports = {
    createIndex: createIndex,
    deleteIndex: deleteIndex,
    insertTenant: insertTenant,
    countTenants: countTenants,
    search: search
};

// createIndex('hello');
