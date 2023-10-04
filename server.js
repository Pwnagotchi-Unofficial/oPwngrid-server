const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const mysql = require("mysql2");

// custom logger
function log(req, res, next) {
    console.log("Got a request type: " + req.method);
    console.warn("Got: " + req.originalUrl);
    //console.log(req.headers)
    next();
}

// get port on which service should be available from env
const port = process.env.PORT;

// create database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB,
    password: process.env.DB_PASS
});

// use custom logger and set up CORS
app.use(log);
app.use(cors({ origin: ["https://opwngrid.xyz","https://api.opwngrid.xyz"] }));

// TODO: ideally completely drop this
app.get("*", function(req, res, next){ 
    if(req.headers.host == "opwngrid.xyz") { //if it's a sub-domain
        if (req.url.includes("/api/")) {
            res.send("API not here");
            return;
        } else {
            //next();
            return;
        }
    } else if (req.headers.host == "api.opwngrid.xyz") {
        if (req.url.includes("/api/")) {
            next(); 
            return;
        } else {
            res.status(404).json({"error":"Not Found"});
            return;
        }
    } 
    res.status(404).json({"error":"Not Found"});
});

// all routes leading to static content here
// disabled, since frontend moved to its own repo
//require("./routes/static_routes.js")(app);

// all routes regarding statistics
require("./routes/statistics_routes.js")(app, connection);

// all routes regarding API
require("./routes/api_GET_routes.js")(app, connection);
require("./routes/api_POST_routes.js")(app, connection);

process.on("SIGINT", function() {
    connection.end(function(err) {
        process.exit(err ? 1 : 0);
    });
});

//App Listen ---------------------------
app.listen(port, () => {
    console.log(`grid listening on port ${port}`);
});
