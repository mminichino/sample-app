// A very basic web server in node.js

var port = 8080;

var http = require("http");
var path = require("path");
var fs = require("fs");
var checkMimeType = true;

if (process.env.APPVERSION != undefined) {
  var appversion = process.env.APPVERSION
} else {
  var appversion = 1
}

console.log("Starting web server on port " + port);

http.createServer( function(req, res) {

  var now = new Date();

  var filename = req.url || "/index.html";
  if (filename == '/') {
    filename = "/index.html";
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
      if (mimeType != undefined) {
        res.setHeader("Content-Type", mimeType);
      }
      res.statusCode = 200;
      if(mimeType == "text/html") {
          contents = contents.toString('utf8');
          contents = contents.replace("{{version}}", appversion);
          contents = Buffer.from(contents, 'utf8');
          res.setHeader("Content-Length", contents.length);
          res.end(contents);
      } else {
        res.setHeader("Content-Length", contents.length);
        res.end(contents);
      }
    } else {
      res.writeHead(500);
      res.end();
    }
  });
}
