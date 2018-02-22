const { Container, publicInternet } = require('@quilt/quilt');
const haproxy = require('@quilt/haproxy');
const Node = require('@quilt/nodejs');
const Kibana = require('./kibana.js').Kibana;
const spark = require('./sparkImgProc.js').sprk;
const elasticsearch = require('@quilt/elasticsearch');

function nodeServer(count, nodeRepo) {
    this.pw = 'runner';
    this.instance_number = count;

    this.elastic = new elasticsearch.Elasticsearch(1);

    this.logstash = new Container('logstash', 'hantaowang/logstash-postgres');

    this.kib = new Kibana(this.elastic);

    this.postgres = new Container('postgres', 'library/postgres:9.4', {
        env: {
            'password': this.pw,
            'port': '5432'
        }
    });

    this.mysql = new Container('mysql', 'mysql:5.6.32', {
        env: {
            MYSQL_USER: 'user',
            MYSQL_PASSWORD: this.pw,
            MYSQL_DATABASE: 'my_db',
            MYSQL_ROOT_PASSWORD: this.pw
        }
    });

    // this.mongo = new Container('mongo', 'library/mongo', {
    //     env: {
    //         'password': this.pw,
    //         'port': '27107'
    //     }
    // });

    this.mysqlHost = this.mysql.getHostname();
    this.postgresURL = 'postgresql://postgres:runner@' + this.postgres.getHostname() + ':5432/postgres';
    this.postgresHost = 'postgresql://postgres:runner@' + this.postgres.getHostname();
    this.postgresPort = '5432';

    this.app = new Node({
	nWorker: count,
	repo: nodeRepo,
	env:{
	    //PORT: this.postgresPort,
        'mySQLHost': this.mysqlHost,
        'elasticURL': this.elastic.uri(),
        'postgresURL': this.postgresURL,
        PW: this.pw,
        HOST:'postgresql://postgres:runner@' + this.postgres.getHostname(),
        PORT:'5432',
		},
    });

    // this.app.withEnv('mySQLHost', );
    // this.app.withEnv('elasticURL', this.elasticURL);
    // this.app.withEnv('postgresURL', this.postgresURL);
    // this.app.withEnv({'PW':this.pw, 'HOST':'postgresql://postgres:runner@' + this.postgres.getHostname(), 'PORT':'5432'});
    // this.spark.setEnv('mySQLHost', this.mysqlHost);

    this.proxy = haproxy.simpleLoadBalancer(this.app.cluster);
    this.proxy.allowFrom(publicInternet, haproxy.exposedPort);

    for (i = 0; i < this.instance_number; i++) {
        this.elastic.addClient(this.app.cluster[i]);
        this.app.cluster[i].allowFrom(this.postgres, 5432);
        this.postgres.allowFrom(this.app.cluster[i], 5432);
        this.app.cluster[i].allowFrom(this.mysql, 3306);
        this.mysql.allowFrom(this.app.cluster[i], 3306);
    }

    this.elastic.addClient(this.logstash);
    this.logstash.allowFrom(this.postgres, 5432)

    //this.mysql.allowFrom(spark.masters, 3306);
    //this.mysql.allowFrom(spark.workers, 3306);

    // logstash.placeOn({size: "m4.large"});

    // elastic.addClient(node);

    // this.app.allowFrom(mongo, 27017);
    // this.mongo.allowFrom(node.app, 27017);

    this.deploy = function deploy(deployment) {
    deployment.deploy([this.app, this.proxy, this.elastic, this.logstash, this.postgres, this.mysql, this.kib]);
    };
}

 module.exports = nodeServer;
