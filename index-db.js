// A very basic web server in node.js
// With MySQL integration

var port = 8080;

var http = require("http");
var path = require("path");
var fs = require("fs");
var checkMimeType = true;
var mysql = require("mysql");
var useragent = require('express-useragent');

if (process.env.APPVERSION != undefined) {
  var appversion = process.env.APPVERSION
} else {
  var appversion = 1
}

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
        getFile(localPath, res, mimeType, req);
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

async function connectToDatabase(connection) {
  await new Promise((resolve,reject)=>{
    connection.connect(function(err){
    if(err){
      console.log('Error connecting to database: ', err);
      reject(err);
    }
    console.log('Connection to database successful');
      connection.query('CREATE TABLE IF NOT EXISTS visits (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, ts BIGINT)',function(err) {
      if(err) reject(err);
    });
  });
  resolve(connection);
  });
}

async function updateContents(contents, req) {
  var connection = mysql.createConnection({ host: process.env.MYSQL_HOST,
                                                   user: process.env.MYSQL_USER,
                                                   password: process.env.MYSQL_PASSWORD,
                                                   database: process.env.MYSQL_DATABASE});
  var data = await new Promise((resolve, reject)=>{
    (async function f(){
      try {
        connection = await connectToDatabase(connection);
      } catch(err) {
        reject(err);
      }
    })();
    connection.query('INSERT INTO visits (ts) values (?)', Date.now(), function (err, dbRes) {
      if (err) reject(err);
      contents = contents.toString('utf8');
      contents = contents.replace("{{number}}", dbRes.insertId);
      contents = contents.replace("{{version}}", appversion);
      var requestIp = req.connection.remoteAddress;
      requestIp = requestIp.replace("::ffff:","");
      contents = contents.replace("{{requestorip}}", requestIp);
      var source = req.headers['user-agent'],
      ua = useragent.parse(source);
      if (ua.isDesktop == true) {
        var deviceType = "Desktop";
      } else if (ua.isTablet == true) {
        var deviceType = "Tablet";
      } else {
        var deviceType = "Mobile";
      }
      contents = contents.replace("{{devtype}}", deviceType);
      contents = contents.replace("{{webbrowser}}", ua.browser + " " + ua.version);
      contents = contents.replace("{{browseros}}", ua.os);
      var podName = process.env.POD_NAME || "No Pod Name";
      contents = contents.replace("{{podname}}", podName);
      contents = Buffer.from(contents, 'utf8');
      resolve(contents);
    });
  });
  return data;
}

function getFile(localPath, res, mimeType, req) {
  fs.readFile(localPath, function(err, contents) {
    if(!err) {
      if (mimeType != undefined) {
        res.setHeader("Content-Type", mimeType);
      }
      if(mimeType == "text/html") {
        (async function f(){
          try {
            contents = await updateContents(contents, req);
          } catch(err) {
            res.writeHead(500);
            res.end(err);
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Length", contents.length);
          res.end(contents);
        })();
      } else {
        res.statusCode = 200;
        res.setHeader("Content-Length", contents.length);
        res.end(contents);
      }
    } else {
      res.writeHead(500);
      res.end();
    }
  });
}
