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

const logstash = new quilt.Container('logstash', 'lomo/logstash-postgresql-output');


const postgres = new quilt.Container('postgres', 'library/postgres', {
    env: {
        'password': pw,
        'port': '5432'
    }
});

const mysql = new quilt.Container('mysql', 'mysql:5.6.32', {
    env: {
        MYSQL_USER: 'user',
        MYSQL_PASSWORD: pw,
        MYSQL_DATABASE: 'my_db',
        MYSQL_ROOT_PASSWORD: pw
    }
});

// const mongo = new quilt.Container('mongo', 'library/mongo', {
//     env: {
//         'password': pw,
//         'port': '27107'
//     }
// });

const mysqlHost = mysql.getHostname();
const postgresURL = 'postgresql://postgres:runner@' + postgres.getHostname() + ':5432/postgres'

const node = new nodeServer(elastic, mysqlHost, elastic.uri(), postgresURL);

const spark = new quilt.Container('spark', 'osalpekar/spark-image-compressor', {
    env: {
        'password': pw,
        'port': '12347',
        'mySQLHost': mysqlHost
    }
});

node.container.allowFrom(postgres, 5432);
postgres.allowFrom(node.container, 5432);
node.container.allowFrom(mysql, 3306);
mysql.allowFrom(node.container, 3306);
spark.allowFrom(mysql, 3306);
mysql.allowFrom(spark, 3306);
// node.container.allowFrom(mongo, 27017);
// mongo.allowFrom(node.container, 27017);

elastic.addClient(logstash);
logstash.placeOn({size: "m4.large"});
quilt.allow(logstash, postgres, 5432);


deployment.deploy(baseMachine.asMaster());
deployment.deploy(baseMachine.asWorker().replicate(6));
node.deploy(deployment);
deployment.deploy(elastic);
deployment.deploy(logstash);
deployment.deploy(postgres);
deployment.deploy(mysql);
deployment.deploy(spark);
