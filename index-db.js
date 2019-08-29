// A very basic web server in node.js
// With MySQL integration

var port = 8080;

var http = require("http");
var path = require("path");
var fs = require("fs");
var checkMimeType = true;
var mysql = require("mysql");
var useragent = require('express-useragent');
var startTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

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

function connectToDatabase() {
var promise = new Promise((resolve,reject)=> {
  var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  connection.connect(function (err) {
    if (err) {
      console.log('Error connecting to database: ');
      reject(err);
    }
    console.log('Connection to database successful');
    connection.query('CREATE TABLE IF NOT EXISTS visits (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, ts BIGINT)', function (err) {
      console.log('Created visits table');
      if (err) {
        console.log('Can not create table visits');
        reject(err);
      }
      connection.query('CREATE TABLE IF NOT EXISTS visitdata (id INT NOT NULL PRIMARY KEY, ' +
          'requestip VARCHAR(40), ' +
          'browsertype VARCHAR(100), ' +
          'browservers VARCHAR(40), ' +
          'devtype VARCHAR(100), ' +
          'ostype VARCHAR(100), ' +
          'podname VARCHAR(64), ' +
          'visitdate BIGINT)', function (err) {
        if (err) reject(err);
        console.log('Created visitdata table');
      });
    });
  });
  console.log('Connect to DB done...');
  resolve(connection);
//  });
//  makeRequest();
});
return promise;
}

function updateContents(connection, contents, req) {
  var promise = new Promise((resolve,reject)=> {
  console.log('Start Update Contents');
      var visitTime = Date.now();
      connection.query('INSERT INTO visits (ts) values (?)', visitTime, function (err, dbRes) {
        if (err) reject(err);
        contents = contents.toString('utf8');
        contents = contents.replace("{{number}}", dbRes.insertId);
        contents = contents.replace("{{version}}", appversion);
        var requestIp = req.connection.remoteAddress;
        requestIp = requestIp.replace("::ffff:", "");
        if (req.headers['X-Forwarded-For'] != undefined) {
          requestIp = req.headers['X-Forwarded-For'] + ", " + requestIp;
        }
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
        var nodeName = process.env.NODE_NAME || "No Node Name";
        contents = contents.replace("{{nodename}}", nodeName);
        contents = contents.replace("{{starttime}}", startTime);
        contents = Buffer.from(contents, 'utf8');
        connection.query('INSERT INTO visitdata (id, requestip, browsertype, browservers, devtype, ostype, podname, visitdate) values (?,?,?,?,?,?,?,?)',
            [dbRes.insertId, requestIp, ua.browser, ua.version, deviceType, ua.os, podName, visitTime], function (err, dbResB) {
              if (err) reject(err);
            });
        console.log('End Update Contents');
        resolve(contents);
      });
//    })();
  });
  return promise;
}

function getFile(localPath, res, mimeType, req) {
  fs.readFile(localPath, function(err, contents) {
    if(!err) {
      if (mimeType != undefined) {
        res.setHeader("Content-Type", mimeType);
      }
      if(mimeType == "text/html") {
            connectToDatabase().then(function(connection){
               updateContents(connection, contents, req).then(function(contents){
                  res.statusCode = 200;
                  res.setHeader("Content-Length", contents.length);
                  res.end(contents);
               });
            });
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
