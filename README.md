# sample-app
Sample App for Docker/Kubernetes Demos

$ git clone https://github.com/mminichino/sample-app
$ cd sample-app
$ docker build -t demo/sample-app .
$ docker run -itd --network=host demo/sample-app

Connect to http://host_ip_address:8080