// SampleApp Demo App

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const app = express();
const useragent = require('express-useragent');
const startTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
global.useragent = useragent;
global.startTime = startTime;

const {getHomePage} = require('./home');
const {getVisitors} = require('./visitors');
//REST interface
const {getRESTAPIVisitors} = require('./restapivisitors');
const {getRESTAPIList} = require('./restapilist');
//Container or Pod port
const port = 8080;

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

connection.connect(function (err) {
    if (err) {
        console.log('Error connecting to database: ');
        throw(err);
    }
    console.log('Connection to database successful');
    connection.query('CREATE TABLE IF NOT EXISTS visits (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, ts BIGINT)', function (err) {
        console.log('Created visits table');
        if (err) {
            console.log('Can not create table visits');
            throw(err);
        }
        connection.query('CREATE TABLE IF NOT EXISTS visitdata (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, ' +
            'vnum INT, ' +
            'requestip VARCHAR(40), ' +
            'browsertype VARCHAR(100), ' +
            'browservers VARCHAR(40), ' +
            'devtype VARCHAR(100), ' +
            'ostype VARCHAR(100), ' +
            'podname VARCHAR(64), ' +
            'visitdate BIGINT)', function (err) {
            if (err) throw(err);
            console.log('Created visitdata table');
        });
    });
});
global.connection = connection;

if (process.env.APPVERSION != undefined) {
    var appversion = process.env.APPVERSION;
} else {
    var appversion = 1;
}
global.appversion = appversion;

// configure app
app.set('port', process.env.port || port); // set express to use this port
app.set('views', __dirname + '/views'); // set express to look in this folder to render our view
app.set('view engine', 'ejs'); // configure template engine
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // parse form data client
app.use(express.static(path.join(__dirname, 'public'))); // configure express to use public folder

app.get('/', getHomePage);
app.get('/visitors', getVisitors);
app.get('/visitors/:page', getVisitors);
app.get('/v1/visitors/count', getRESTAPIVisitors);
app.post('/v1/visitors/count', getRESTAPIVisitors);
app.get('/v1/visitors/list', getRESTAPIList);
app.post('/v1/visitors/list', getRESTAPIList);

// start the app and listen on the port
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});