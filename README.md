# sample-app
Sample App for Docker/Kubernetes Demos

```
$ git clone https://github.com/mminichino/sample-app
$ cd sample-app
$ docker build -t demo/sample-app .
$ docker run -itd --network=host demo/sample-app
```

Connect to http://host_ip_address:8080

To run the two tier sample app:

```
$ docker run -d --network=host -e MYSQL_ROOT_PASSWORD='password' -e MYSQL_USER='sampleapp' -e MYSQL_PASSWORD='password' -e MYSQL_DATABASE='sampleapp' --expose=3306 mysql:5.7
$ docker run -d --network=host -e MYSQL_ROOT_PASSWORD='password' -e MYSQL_USER='sampleapp' -e MYSQL_PASSWORD='password' -e MYSQL_DATABASE='sampleapp' -e APPVERSION=1 mminichino/sample-app node index-db.js
```