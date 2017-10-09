const quilt = require('@quilt/quilt');
const elasticsearch = require('@quilt/elasticsearch');
const nodeServer = require('./nodeServer.js').nodeServer;

const deployment = quilt.createDeployment({namespace: "omkar"});

var baseMachine = new quilt.Machine({
    provider: "Amazon",
    size: "m4.large",
    sshKeys: quilt.githubKeys('osalpekar'),
    preemptible: true,
    diskSize: 16
});

var numElasticServers = 1;
const pw = 'runner';

const elastic = new elasticsearch.Elasticsearch(numElasticServers);

// const nodeServer = new quilt.Container('nodeServer', 'osalpekar/node-apartment-app', {
//     env: {
//         'password': pw,
//         'port': '3000'
//     }
// });

const node = new nodeServer(elastic);

const logstash = new quilt.Container('logstash', 'lomo/logstash-postgresql-output'); //, {
    // env: {
        // 'password': pw,
        // 'port': 12346
    // }
// });

// const spark = new quilt.Container('spark', 'osalpekar/spark-service', {
//     env: {
//         'password': pw,
//         'port': 12347
//     }
// });

const postgres = new quilt.Container('postgres', 'library/postgres', {
    env: {
        'password': pw,
        'port': '5432'
    }
});

const mysql = new quilt.Container('mysql', 'library/mysql', {
    env: {
        'password': pw,
        'port': '3306'
    }
});

// node.allowFrom(elastic, 9200);
// elastic.allowFrom(nodeServer, 9200);
node.container.allowFrom(postgres, 5432);
postgres.allowFrom(node.container, 5432);
node.container.allowFrom(mysql, 3306);
mysql.allowFrom(node.container, 3306);

elastic.addClient(logstash);
logstash.placeOn({size: "m4.large"});
quilt.allow(logstash, postgres, 5432);

// logstash.allowFrom(elastic, 12346);
// elastic.allowFrom(logstash, 12346);
// logstash.allowFrom(postgres, 5432);
// postgres.allowFrom(logstash, 5432);


// node.container.allowFrom(quilt.publicInternet, 3000);


deployment.deploy(baseMachine.asMaster());
deployment.deploy(baseMachine.asWorker().replicate(5));
// deployment.deploy(nodeServer);
node.deploy(deployment);
deployment.deploy(elastic);
deployment.deploy(logstash);
deployment.deploy(postgres);
deployment.deploy(mysql);
