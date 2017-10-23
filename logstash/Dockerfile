FROM lomo/logstash-postgresql-output
RUN apt-get update && apt-get -y install procps
RUN rm -f /usr/share/logstash/pipeline/logstash.conf
RUN /opt/logstash/bin/logstash-plugin install logstash-filter-json
ADD pipeline/default.conf /usr/share/logstash/pipeline/default.conf

ENTRYPOINT []
CMD ./docker-entrypoint.sh -f /usr/share/logstash/pipeline/default.conf --debug
