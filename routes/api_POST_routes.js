const updateToken = require("../utils/token.js");
const crypto = require("crypto");
require("dotenv").config();
const utils = require("../utils/helpers.js");

module.exports = function (app, connection) {
    // enroll post
    app.post("/api/v1/unit/enroll", utils.toJson, (req, res) => {
        // enroll sends
        // enrollment := map[string]interface{}{
        // 	"identity":   identity,
        // 	"public_key": pubKeyPEM64,
        // 	"signature":  signature64,
        // 	"data":       c.data,
        // }
        console.log("Enroll from: " + req.body.identity);

        const identity = req.body.identity.split("@");

        // Before we enroll we want to check the device follows our methods of verifying identity
        let pub_key = Buffer.from(req.body.public_key, "base64").toString();
        const KeyString = pub_key.split("RSA ").join("");
        const result = crypto.verify(
            "rsa-sha256",
            new TextEncoder().encode(req.body.identity),
            {
                key: KeyString,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING
            },
            Buffer.from(req.body.signature, "base64"));

        if (!result) {
            console.warn("Signature is NOT valid. A device has attempted to enroll that cannot verify its self.");
            res.status(401).json({ "error": "signature is invalid" });
            return;
        } else if (result) {
            console.log("Signature is valid. continuing");
        } else {
            console.error("Result is not true or false, how does this work?");
            res.status(401).json({ "error": "signature is invalid" });
            return;
        }
        // check if unit is already in our database
        connection.query("SELECT * from units WHERE identity = ?",
            [ identity[1] ],
            function (err, results) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ "error": "Internal Server Error" });
                    return;
                }
                if (results.length == 0) {
                    console.log("Enrolling New");
                    let country = "XX";
                    let addr = null;
                    let data = {};

                    pub_key = Buffer.from(req.body.public_key, "base64").toString();
                    if (req && req.headers && req.headers["x-forwarded-for"]) {
                        addr = req.headers["x-forwarded-for"];
                    } else {
                        console.warn("Error: X-Forwarded-For header is missing or undefined");
                        addr = null;
                    }
                    if (req && req.headers && req.headers["cf-ipcountry"]) {
                        country = req.headers["cf-ipcountry"];
                    } else {
                        console.warn("Error: CF-IpCountry header is missing or undefined");
                        country = "XX";
                    }
                    if (req && req.body && req.body.data) {
                        data = req.body.data;
                    } else {
                        console.warn("Error: data is missing or undefined");
                        data = {};
                    }
                    connection.query("INSERT INTO units (name,identity,public_key,address,country,data) VALUES (?,?,?,?,?,?)",
                        [ identity[0], identity[1], pub_key, addr, country, JSON.stringify(data) ],
                        function (results) {
                            res.status(200).send(JSON.stringify({ "token": updateToken(identity, results.insertId) }));
                            console.log("Enrolled new");
                            return;
                        }
                    );
                } else if (results.length == 1) {
                    let data = {};
                    if (req && req.body && req.body.data) {
                        data = req.body.data;
                    } else {
                        console.error("Error: data is missing or undefined");
                        data = {};
                    }
                    connection.query("UPDATE units SET data=?, updated_at = CURRENT_TIMESTAMP, name = ? WHERE identity = ? LIMIT 1",
                        [ JSON.stringify(data), identity[0], identity[1] ],
                        function (err) {
                            if (err) {
                                console.error(err);
                                res.status(500).json({ "error": "Internal Server Error" });
                                return;
                            }
                            console.log("Updating enrollee: " + identity[1]);
                            return;
                        });
                    res.status(200).send(JSON.stringify({ "token": updateToken(identity, results.insertId) }));
                } else if (results.length > 1) {
                    console.log("Tried to enroll, but database return error or more than 1 match");
                    res.status(500).json({ "error": "Internal Server Error. Please report this to @rai68 asap, as a id_rsa has been matched, which doesnt make sense." });
                    return;
                }
            });
    });

    // send APs Posts
    app.post("/api/v1/unit/report/ap", utils.toJson, utils.authenticate, (req, res) => {
        console.log("AP received");
        if (res.locals.authorised === false) {
            console.warn("Warning | Unauthorised device tried to send AP");
            res.status(401).json({ "error": "Unauthorised request" });
            return;
        }
        // Check if BSSID has been reported before
        connection.query("SELECT bssid, essid, identity FROM aps WHERE bssid = (UNHEX(REPLACE(?, ':','' )))",
            [ req.body.bssid ],
            function (err, results) {
                if (err) {
                    console.log(err);
                    res.status(500).json({ "error": "Internal Server Error" });
                    return;
                }
                // If results is 0, the ap doesnt exist, but if its 1 or more, multiple devices have reported it.
                if (results.length <= 1) {
                    let reported = false;
                    results.forEach((element) => {
                        if (element.identity == res.locals.author.unit_ident[1]) {
                            reported = true;
                            return;
                        }
                    });
                    if (reported == false) {
                        // add stuff here to include the AP even if its been reported, not sure how, maybe an array. Ok so how is adding another row for the same AP
                        connection.query("INSERT INTO aps (bssid, essid, identity, time) VALUES (UNHEX(REPLACE(?, ':','' )), ?,?, CURRENT_TIMESTAMP)",
                            [ req.body.bssid, req.body.essid, res.locals.author.unit_ident[1] ],
                            function (err) {
                                if (err) {
                                    // Handle the error, but don't send a response here
                                    console.error(err);
                                    res.status(500).json({ "error": "Internal Server Error" });
                                    return;
                                }
                                // Send a response when the insertion is successful
                                res.status(200).json({ "status": "success" });
                            }
                        );
                    } else {
                        res.status(200).json({ "status": "success" });
                        return;
                    }
                    return;
                } else if (results.length >= 0) {
                    console.log("Received new AP");
                    console.log(req.body.bssid);
                    // Because no APs exist with that SSID, add it to the database.
                    connection.query("INSERT INTO aps (bssid, essid, identity, time) VALUES (UNHEX(REPLACE(?, ':','' )), ?,?, CURRENT_TIMESTAMP)",
                        [ req.body.bssid, req.body.essid, res.locals.author.unit_ident[1] ],
                        function (err) {
                            if (err) {
                                // Handle the error, but don't send a response here
                                console.error(err);
                                res.status(500).json({ "error": "Internal Server Error" });
                                return;
                            }
                            // Send a response when the insertion is successful
                            res.status(200).json({ "status": "success" });
                        }
                    );
                }
            }
        );
    });

    app.post("/api/v1/unit/report/aps", utils.toJson, utils.authenticate, (req, res) => {
        console.log("AP received");
        if (res.locals.authorised === false) {
            console.warn("Warning | Unauthorised device tried to send AP");
            res.status(401).json({ "error": "Unauthorised request" });
            return;
        }

        req.body.forEach(function (ap) {
            connection.query("SELECT bssid, essid FROM aps WHERE bssid = (UNHEX(REPLACE(?, ':','' )))",
                [ ap.bssid ],
                function (err, results) {
                    if (err) {
                        console.log(err);
                        res.status(500).json({ "error": "Internal Server Error" });
                        return;
                    }
                    // If results is 0, it exists, so send OK
                    if (results.length == 1) {
                        console.log("Received existing AP");
                        console.log(results.length);
                        res.status(200).json({ "status": "success" });
                        return;
                    } else if (results.length >= 0) {
                        console.log("Received new AP");
                        // Because no APs exist with that SSID, add it to the database.
                        connection.query("INSERT INTO aps (bssid, essid, identity, time) VALUES (UNHEX(REPLACE(?, ':','' )), ?,?, CURRENT_TIMESTAMP)",
                            [ ap.bssid, ap.essid, res.locals.author.unit_ident[1] ],
                            function (err) {
                                if (err) {
                                    // Handle the error, but don't send a response here
                                    console.error(err);
                                    res.status(500).json({ "error": "Internal Server Error" });
                                    return;
                                }
                                // Send a response when the insertion is successful
                                res.status(200).json({ "status": "success" });
                            }
                        );
                    }
                }
            );
        });
    });
};