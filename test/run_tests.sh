#!/bin/sh
#
FAIL=0
TIMEOUT=50
COUNT=1
RETRY=5

echo "Starting container..."
docker run -d --name sampleapp-test -p 8080:8080 mminichino/sample-app node index-static.js
[ $? -ne 0 ] && exit 1

while ! nc -z localhost 8080; do
  COUNT=$(($COUNT+1))
  if [ $COUNT -gt $TIMEOUT ]
  then
     echo "Timeout"
     exit 1
  fi
  sleep 0.1
done

while [ $RETRY -ge 0 ]; do
curl http://127.0.0.1:8080 > /tmp/sampleapp.curl.test
grep "Version: 1" /tmp/sampleapp.curl.test
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

echo "Stopping container..."
docker stop sampleapp-test
[ $? -ne 0 ] && exit 1
echo "Removing container..."
docker rm sampleapp-test
[ $? -ne 0 ] && exit 1

[ $FAIL -ne 0 ] && exit 1

exit 0