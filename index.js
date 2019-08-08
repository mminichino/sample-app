var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.render(index);
});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Sample App Running ... URL: http://%s:%s', host, port);
});
