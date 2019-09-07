#!/bin/sh
#
FAIL=0
TIMEOUT=6000
COUNT=1
RETRY=5

echo "Starting DB container..."
docker run -d --name sampleapp-test-db -e MYSQL_ROOT_PASSWORD='password' -e MYSQL_USER='sampleapp' -e MYSQL_PASSWORD='password' -e MYSQL_DATABASE='sampleapp' -p 3306:3306 mysql:5.7
[ $? -ne 0 ] && exit 1

DB_CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sampleapp-test-db)
if [ -z "$DB_CONTAINER_IP" ]
then
   echo "Error can not get container IP"
   docker stop sampleapp-test-db
   docker rm sampleapp-test-db
   exit 1
fi

while ! nc -z $DB_CONTAINER_IP 3306; do
  COUNT=$(($COUNT+1))
  if [ $COUNT -gt $TIMEOUT ]
  then
     echo "Timeout"
     docker logs sampleapp-test-db
     docker stop sampleapp-test-db
     docker rm sampleapp-test-db
     exit 1
  fi
  sleep 0.1
done

COUNT=1
echo "Starting App container..."
docker run -d --name sampleapp-test -e MYSQL_HOST=$DB_CONTAINER_IP -e MYSQL_USER='sampleapp' -e MYSQL_PASSWORD='password' -e MYSQL_DATABASE='sampleapp' -p 8080:8080 mminichino/sample-app node index.js
[ $? -ne 0 ] && exit 1

APP_CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sampleapp-test)
if [ -z "$APP_CONTAINER_IP" ]
then
   echo "Error can not get container IP"
   docker stop sampleapp-test
   docker rm sampleapp-test
   exit 1
fi

while ! nc -z $APP_CONTAINER_IP 8080; do
  COUNT=$(($COUNT+1))
  if [ $COUNT -gt $TIMEOUT ]
  then
     echo "Timeout"
     docker logs sampleapp-test
     docker stop sampleapp-test
     docker rm sampleapp-test
     exit 1
  fi
  sleep 0.1
done

while [ $RETRY -ge 0 ]; do
curl http://${APP_CONTAINER_IP}:8080 > /tmp/sampleapp.curl.test
grep "Redirecting" /tmp/sampleapp.curl.test
if [ $? -ne 0 ]
then
   echo "Test Failed"
   FAIL=1
else
   echo "Success"
   FAIL=0
   break
fi
RETRY=$(($RETRY-1))
sleep 1
done

echo "Stopping App container..."
docker stop sampleapp-test
[ $? -ne 0 ] && exit 1

echo "Stopping DB container..."
docker stop sampleapp-test-db
[ $? -ne 0 ] && exit 1

echo "Removing App container..."
docker rm sampleapp-test
[ $? -ne 0 ] && exit 1

echo "Removing DB container..."
docker rm sampleapp-test-db
[ $? -ne 0 ] && exit 1

[ $FAIL -ne 0 ] && exit 1

exit 0