#!/bin/sh
#

export PATH=$PATH:/usr/local/bin
COMPOSE_ID=${JOB_NAME:-local}

docker-compose -p $COMPOSE_ID rm -f
docker-compose -p $COMPOSE_ID -f docker-compose-integration.yaml up --force-recreate --abort-on-container-exit
[ $? -ne 0 ] && exit 1
curl http://127.0.0.1:8080 > /tmp/sampleapp.curl.test
[ $? -ne 0 ] && exit 1
grep "Version: 2" /tmp/sampleapp.curl.test
[ $? -ne 0 ] && exit 1
docker-compose -p $COMPOSE_ID -f docker-compose-integration.yaml down -v
[ $? -ne 0 ] && exit 1

exit 0