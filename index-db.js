// A very basic web server in node.js
// With MySQL integration

var port = 8080;

var http = require("http");
var path = require("path");
var fs = require("fs");
var checkMimeType = true;
// visitcounter = 0;
var mysql = require("mysql");
var con = mysql.createConnection({ host: process.env.MYSQL_HOST, user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE});

con.connect(function(err){
  if(err){
    console.log('Error connecting to database: ', err);
    return;
  }
  console.log('Connection to database successful');
  con.query('CREATE TABLE IF NOT EXISTS visits (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, ts BIGINT)',function(err) {
    if(err) throw err;
  });
});

console.log("Starting web server on port " + port);

http.createServer( function(req, res) {

  var now = new Date();

  var filename = req.url || "/index-db.html";
  if (filename == '/') {
    filename = "/index-db.html";
  }
  var ext = path.extname(filename);
  var localPath = __dirname;
  var validExtensions = {
    ".html" : "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".txt": "text/plain",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".png": "image/png",
    ".woff": "application/font-woff",
    ".woff2": "application/font-woff2"
  };

  var validMimeType = true;
  var mimeType = validExtensions[ext];
  if (checkMimeType) {
    validMimeType = validExtensions[ext] != undefined;
  }

  if (validMimeType) {
    localPath += filename;
    fs.exists(localPath, function(exists) {
      if(exists) {
        console.log("Serving file: " + localPath);
        getFile(localPath, res, mimeType);
      } else {
        console.log("File not found: " + localPath);
        res.writeHead(404);
        res.end();
      }
    });

  } else {
    console.log("Invalid file extension detected: " + ext + " (" + filename + ")")
  }

}).listen(port);

function getFile(localPath, res, mimeType) {
  fs.readFile(localPath, function(err, contents) {
    if(!err) {
      res.setHeader("Content-Length", contents.length);
      if (mimeType != undefined) {
        res.setHeader("Content-Type", mimeType);
      }
      if(mimeType == "text/html") {
          console.log('Inserting data into visits table');
          con.query('INSERT INTO visits (ts) values (?)', Date.now(),function(err, dbRes) {
          if (err) throw err;
          contents = contents.toString()
          contents = contents.replace("{{number}}", dbRes.insertId);
          console.log("Inside loop visits " + dbRes.insertId)
          res.statusCode = 200;
          res.end(contents);
        });
      } else {
          res.statusCode = 200;
          res.end(contents);
      }
    } else {
      res.writeHead(500);
      res.end();
    }
  });
}
