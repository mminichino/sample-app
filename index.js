// SampleApp Demo App
console.log("Starting SampleApp");

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const app = express();
const useragent = require('express-useragent');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const config = require('./config');
const redis = require('ioredis');
const clustermode = config.clusterMode;
let redisClient = null;

console.log("MySQL Database Host: " + config.mysqlHost + " User/Database: " + config.mysqlUser + "/" + config.mysqlDatabase);
console.log("Redis Host: " + config.redisHost + " Redis Port: " + config.redisPort);

if (clustermode === 0) {
    console.log("Redis connect in single instance mode");
    redisClient = new redis({port: config.redisPort, host: config.redisHost});
} else {
    console.log("Redis connect in cluster mode");
    redisClient = new redis.Cluster([{port: config.redisPort, host: config.redisHost}]);
}

redisClient.on('error', err => {
    console.log('Redis Error ' + err);
});

const redisStore = require('connect-redis')(session);
const startTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
global.useragent = useragent;
global.startTime = startTime;

const {getHomePage} = require('./home');
const {getHealthCheckPage} = require('./healthz');
const {getVisitors} = require('./visitors');
const {getLoginPage} = require('./login');
const {checkToken} = require('./auth');
const {sessionChecker} = require('./auth');
const {sessionLogout} = require('./auth');
//REST interface
const {getToken} = require('./auth');
const {getRESTAPIVisitors} = require('./restapivisitors');
const {getRESTAPIList} = require('./restapilist');
//Container or Pod port
const port = 8080;

const connection = mysql.createConnection({
    host: config.mysqlHost,
    user: config.mysqlUser,
    password: config.mysqlPassword,
    database: config.mysqlDatabase
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
            connection.query('CREATE TABLE IF NOT EXISTS accounts (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, username VARCHAR(32), password VARCHAR(120))',function(err){
                if (err) throw(err);
                console.log('Created accounts table');
                let query = "SELECT username, password FROM accounts WHERE username = 'admin'";
                connection.query(query, (err, result) => {
                    if (err) throw(err);
                    if (result.length === 0){
                        console.log("Creating default admin account");
                        let query = "INSERT INTO accounts (username, password) values (?,?)";
                        let username = 'admin';
                        let password = '$2a$10$DJU0e472LsjtP6QQUjvboOLsD3Ko26utCQavBvUrWBf.wSiYppKum';
                        connection.query(query, [username,password], (err, result) => {
                            if (err) throw(err);
                        });
                    } else {
                        console.log("Admin account exists");
                    }
                });
            });
        });
    });
});

global.connection = connection;
global.redisClient = redisClient;

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
app.use(cookieParser());
app.use(session({
    key: 'user_sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    },
    store: new redisStore({client: redisClient})
}));
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});

app.get('/', sessionChecker, getHomePage);
app.get('/guest', getHomePage);
app.get('/healthz', getHealthCheckPage);
app.get('/visitors', sessionChecker, getVisitors);
app.get('/visitors/:page', sessionChecker, getVisitors);
app.get('/login', getLoginPage);
/* app.get('/login/:status', getLoginPage); */
app.post('/login', getLoginPage);
app.get('/logout', sessionLogout);
app.post('/v1/authorize', getToken);
/* app.get('/v1/visitors/count', getRESTAPIVisitors); */
app.post('/v1/visitors/count', checkToken, getRESTAPIVisitors);
/* app.get('/v1/visitors/list', getRESTAPIList); */
app.post('/v1/visitors/list', checkToken, getRESTAPIList);

// start the app and listen on the port
app.listen(port, () => {
    console.log('Server running on port: ' + port);
});