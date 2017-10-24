const { Container, publicInternet } = require('@quilt/quilt');

function Kibana(es) {
  this.container = new Container('kibana', 'kibana:4', {
    command: [
      '--port', this.port.toString(),
      '--elasticsearch', es.uri(),
    ],
  });
  es.addClient(this.container);
  this.container.allowFrom(publicInternet, this.port);
}

Kibana.prototype.deploy = function deploy(depl) {
  depl.deploy(this.container);
};

Kibana.prototype.port = 5601;

exports.Kibana = Kibana;
