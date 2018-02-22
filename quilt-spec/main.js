const quilt = require('@quilt/quilt');
const nodeServer = require('./nodeServer.js');

const deployment = quilt.createDeployment({namespace: "tsaianson-aptapp", adminACL: ['0.0.0.0/0']});

var baseMachine = new quilt.Machine({
    provider: "Amazon",
    size: "m4.large",
    sshKeys: quilt.githubKeys('TsaiAnson'),
    preemptible: true,
});

var countNode = 3;
const nodeRepository = 'https://github.com/TsaiAnson/apartment-rental-system.git';
const apartmentApp = new nodeServer(countNode, nodeRepository);

deployment.deploy(baseMachine.asMaster());
deployment.deploy(baseMachine.asWorker().replicate(4));

deployment.deploy(apartmentApp);
