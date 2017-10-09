const { Container, publicInternet } = require('@quilt/quilt');

function nodeServer(es) {
    this.container = new Container('nodeServer', 'osalpekar/node-apartment-app', {
        command: [
            '--port', this.port.toString(),
            '--elasticsearch', es.uri(),
        ]
        // env: {
            // 'password': pw,
            // 'port': '3000'
        // }
    });
    es.addClient(this.container);
    this.container.allowFrom(publicInternet, this.port);
}

nodeServer.prototype.deploy = function deploy(deployment) {
    this.container.deploy(deployment);
}

nodeServer.prototype.port = 3000;

exports.nodeServer = nodeServer;
