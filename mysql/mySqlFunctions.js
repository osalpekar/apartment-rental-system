var connection = require('./mySqlConnection.js');

var query = function (sqlQuery) {
    return con.query(sqlQuery, (err,rows) => {
        if(err) throw err;
        return rows;
    });
}

module.exports = {
    query: query
};
