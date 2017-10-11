var http = require('http');
var config = {
// Options passed directly into the http.request(...) method on each request
    httpOptions: {
        host: 'localhost',
        port: 3000,
        headers: {
'Content-Type': 'application/json'
        }
    },

    requests: [
        { path: '/', method: 'GET', weight: 0.2 },
        { path: '/write', method: 'GET', weight: 0.5 },
        { path: '/read', method: 'GET', weight: 0.1 },
        { path: '/reviews', method: 'GET', weight: 0.2 }
    ],
    responseEncoding: 'utf8',
    stopOnReqError: true, // If true, stops the Node process on request errors (NOT http status codes)
    logHTTPErrors: true,  // Logs any 400+ status code
    stopOn400: false,     // Forces an exit on the Node process on 4XX errors
    stopOn500: true,      // Forces an exit on the Node process on 5XX errors
    requestsPerSecond: 20,
    weighted: [],
    waitTime: 1000
};
(function setup() {

config.requests = config.requests.map(function(req){
return typeof(req) === 'string' ? {path: req} : req;
    });
config.requests.forEach(function(request, reqIndex) {
for (var i=0; i < (request.weight || 0.1) * maxWeight; ++i) {
config.weighted.push(reqIndex);
        }
    });
config.waitTime = 1000 / config.requestsPerSecond
    
    
    sendNext();
    
})();


function sendNext() {
    var nextIndex = config.weighted[ Math.floor(Math.random() * config.weighted.length) ],
        request = config.requests[ nextIndex ];
    
    sendRequest(request.method, request.path, request.data, function(err, res) {
        if (err) {
            console.error(err);
        }
    });
    
    setTimeout(sendNext, config.waitTime);
}


function sendRequest(method, path, data, cb) {
    var options = config.httpOptions || {};
    options.path = path || '/';
    options.method = method || 'GET';
    options.headers = options.headers || {};
    options.headers['Content-Length'] = (data && data.length) || 0;
    
    var req = http.request(options, function(res) {
        var err = null,
            body = '';
        
        res.setEncoding(config.responseEncoding);
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            res.body = body;
            
            if (res.statusCode > 399) {
                err = new Error(body);
                err.status = err.code = res.statusCode;
                
                if (res.statusCode > 499 && config.stopOn500) {
                    process.exit(1);
                } else if (res.statusCode > 399 && config.stopOn400) {
                    process.exit(1);
                }
            }
            
            cb && cb(err, res);
        });
    });
    
    req.on('error', function(err) {
        console.error('Error with request:', err.message);
        if (config.stopOnReqError) {
            process.exit(1);
        } else {
            cb && cb(err);
        }
    });
    
    if (data) {
        req.write(data);
    }
    req.end();
}