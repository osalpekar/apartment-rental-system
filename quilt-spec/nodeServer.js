const { Container, publicInternet } = require('@quilt/quilt');

function nodeServer(es, mysqlHost, elasticURL, postgresURL) {
    this.container = new Container('nodeServer', 'osalpekar/node-apartment-app', {
        command: [
            '--port', this.port.toString(),
            '--elasticsearch', es.uri(),
        ]
        env: {
            // 'password': pw,
            // 'port': '3000'
            'mySQLHost': mysqlHost,
            'elasticURL': elasticURL,
            'postgresURL': postgresURL
        }
    });
    es.addClient(this.container);
    this.container.setEnv('mySQLHost', mysqlHost);
    this.container.setEnv('elasticURL', elasticURL);
    this.container.setEnv('postgresURL', postgresURL);
    this.container.allowFrom(publicInternet, this.port);
}

nodeServer.prototype.deploy = function deploy(deployment) {
    this.container.deploy(deployment);
}

nodeServer.prototype.port = 3000;

exports.nodeServer = nodeServer;
