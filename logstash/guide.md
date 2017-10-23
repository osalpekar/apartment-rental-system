## Quilt API Guide

Import required packages

    const quilt = require('@quilt/quilt');
    const redis = require('@quilt/redis');

Create development and base machines

    const deployment = quilt.createDeployment({namespace: 'willwang'})

    const baseMachine = new quilt.Machine({
        provider: 'Amazon',
        size: 'm4.large',
        preemptible: true,
        diskSize: 16, // Size in GB
        sshKeys: quilt.githubKeys('hantaowang') // Your Github username Here
    })

Use redis package to create redis instances

    const password = 'hunter2';
    const rds = redis.Redis(3, password);

Create a custom container

    const djangoServer = new quilt.Container('djangoServer', 'hantaowang/djangoserver', {
        command: ['python', 'manage.py', 'runserver'],
        env: {
            'redisHost': redis.master.getHostname(),
            'redisPass': password,
            'port': 12345
        }
    });

The API is `quilt.Container(String: label, String: dockerImage, Map(optional): optArgs)`.
The hostname of the container is set to `label + '.q'`. For example, the hostname of djangoServer is `djangoServer.q`.
To create multiple copies of the container, create the container and use `multipleServers = djangoServer.replicate(n)`, which returns an array
of `n` copies of that container. However the `replicate` function *might* going to be removed soon. So if you find it gone, create multiple copies of
a container using a for loop. Do the same for create multiple copies of a machine.

    const multipleServers = []
    for (int i = 0; i < 10; i ++) {
        multipleServers.push(
            new quilt.Container('djangoServer', 'hantaowang/djangoserver', {
                command: ['python', 'manage.py', 'runserver'],
                env: {
                    'redisHost': redis.master.getHostname(),
                    'redisPass': password,
                    'port': 12345
                }
        )
    }

If you have mulitple copies of a container, the hostnames will be different. They are `label + n + '.q'`, where `n` is some number.
Grab them like so. This is independent of whether you use `.replicate` or a for loop.

    function getHostnames(c) {
        return c.getHostname();
    }
    const djangoHostnames = multipleServers.map(getHostname).join(',');

`djangoHostnames` is a string that can be passed as an ENV variable into containers, then parsed for the individual hostnames.

To connect two containers, use `Container1.allowFrom(Container2, port)`. Generally, do this both ways to allow a 2 way connection.
To connect to publicInternet, use `allowFrom` with the pseudo container `quilt.publicInternet`.

    for (c : multipleServers) {
        c.allowFrom(rds.master, 6379);
        rds.master.allowFrom(c, 6379);
        c.allowFrom(quilt.publicInternet, 12345);
    }

Now to finally deploy everything.

    deployment.deploy(baseMachine.asMaster());
    deployment.deploy(baseMachine.asWorker().replicate(5)); // May have to use for loop
    deployment.deploy(rds); // the redis package implements deployment.deploy
    deployment.deploy(djangoServer); // can pass in deployable object
    deployment.deploy(multipleServers); // or an array or deployable objects
