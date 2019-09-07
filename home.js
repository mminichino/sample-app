// Home Page

module.exports = {
    getHomePage: (req, res) => {
        let query = "INSERT INTO visits (ts) values (?)"; // query database
        let visitTime = Date.now();
        let remoteIP = '127.0.0.1';
        let source = req.headers['user-agent'],
            ua = useragent.parse(source);
        if (ua.isDesktop == true) {
            var deviceType = "Desktop";
        } else if (ua.isTablet == true) {
            var deviceType = "Tablet";
        } else {
            var deviceType = "Mobile";
        }
        if (req.headers['x-forwarded-for'] !== undefined) {
            remoteIP = req.headers['x-forwarded-for'];
            let remoteIPs = remoteIP.split(',',2);
            if(remoteIPs.length > 1) {
                remoteIP = remoteIPs[0];
            }
        } else {
            remoteIP = req.connection.remoteAddress.replace("::ffff:", "");
        }
        let webBrowser = ua.browser + " " + ua.version;
        let webBrowserOS = ua.os;
        let podName = process.env.POD_NAME || "No Pod Name";
        let nodeName = process.env.NODE_NAME || "No Node Name";
        if (req.session.user && req.cookies.user_sid){
            var authenticated = 1;
        } else {
            var authenticated = 0;
        }

        // execute query
        connection.query(query, visitTime, (err, result) => {
            if (err) {
                res.redirect('/');
            }
            connection.query('INSERT INTO visitdata (vnum, requestip, browsertype, browservers, devtype, ostype, podname, visitdate) values (?,?,?,?,?,?,?,?)',
                [result.insertId, remoteIP, ua.browser, ua.version, deviceType, webBrowserOS, podName, visitTime], function (err, dbResB) {
                    if (err) res.redirect('/');
                });
            res.render('index.ejs', {
                title: "NetApp Kubernetes Service Demo",
                authstatus: authenticated,
                visits: result.insertId,
                version: appversion,
                requestip: remoteIP,
                devtype: deviceType,
                browser: webBrowser,
                browseros: webBrowserOS,
                podname: podName,
                nodename: nodeName,
                starttime: startTime
            });
        });
    },
};
