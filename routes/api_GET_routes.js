require("dotenv").config();
const utils = require("../utils/helpers.js");

// for tracking uptime
const startTime = Date.now();

module.exports = function(app, connection) {
    // uptime keeper
    app.get("/api/v1/uptime", (req, res) => {
        const time = Date.now() - startTime;
        res.json({isUp:true, uptime:time});
    });

    app.get("/api/v1/units", (req, res) => {
        // TODO: implement
        res.send("Custom API for a new pwn system");
    });

    app.get("/api/v1/units/by_country", (req, res) => {
        // TODO: implement
        res.send("Custom API for a new pwn system");
    });

    app.get("/api/v1/total", (req, res) => {
        // TODO: Preferably move to ORM
        connection.query("SELECT COUNT(ID) AS total, COUNT(DISTINCT SUBSTRING_INDEX(country, ',', -1)) AS countries FROM units",
            function(err, results) {
                if (err) {
                    // TODO: Be more specific
                    res.status(500).json({"error":"Internal Server Error"});
                    console.log(err);
                    return;
                }
                res.send(results[0]);
            });
        return;
    });

    app.get("/api/v1/total/aps", (req, res) => {
        connection.query("SELECT COUNT(ID) AS total FROM aps",
            function(err, results) {
                if (err) {
                    res.status(500).json({"error":"Internal Server Error"});
                    console.log(err);
                    return;
                }
                res.send(results[0]);
            });
        return;
    });

    app.get("/api/v1/recent", (req, res) => {
        connection.query("SELECT name,data,created_at,country,identity FROM units WHERE created_at >= NOW() - INTERVAL 1 YEAR ORDER BY created_at DESC LIMIT 10",
            function(err, results) {
                if (err) {
                    res.status(500).json({"error":"Internal Server Error"});
                    console.log(err);
                    return;
                }
                res.send(results);
            });
        return;
    });

    app.get("/api/v1/unit/inbox/", utils.authenticate, (req, res) => {
        console.log("Got /api/v1/unit/inbox/");
        if (res.locals.authorised == false) {
            console.warn("Unauthorised request to mailbox");
            res.status(401).json({"error":"token expired or cannot be authenticated"});
            return;
        }

        const limit = 10;
        // this value equals the limit per page on a pwnas web interface
        connection.query("SELECT count(id) as count FROM messages WHERE receiver = ? ",
            [ res.locals.author.unit_ident[1] ],
            function(err, results) {
                if (err) {
                    console.log(err);
                    res.status(500).json({"error":"Internal Server Error"});
                    return;
                }


                let offset = 0;
                if (req.query.p === 1) {
                    offset = 0;
                    var pages = Math.ceil(results.count / limit);
                } else {
                    offset = (req.query.p * limit) - limit;
                    pages = Math.ceil(results.count / limit);
                }
                connection.query("SELECT created_at,updated_at,deleted_at,seen_at,sender,sender_name,data,signature,id FROM messages WHERE receiver = ? LIMIT ? OFFSET ?",
                    [ res.locals.author.unit_ident[1], limit, offset ],
                    function(err, results) {
                        if (err) {
                            console.log(err);
                            res.status(500).json({"error":"Internal Server Error"});
                            return;
                        }
                        // Create the pages system pwngrid uses
                        const messages = {
                            "pages": pages,
                            "records":results.length,
                            "messages": results
                        };
                        res.status(200).json(messages);
                        return;
                    });
                return;
            });
        return;
    });

    // Searching for a unit
    // via web search api
    app.get("/api/v1/search/:fingerprint", utils.authenticate, (req, res) => {
        // got unit search
        // https://pwnagotchi.ai/api/grid/#get-api-v1-unit-fingerprint
        console.log("Got web search for " + req.params.fingerprint);
        // Query fingerprint via mysql
        connection.query("SELECT created_at,updated_at,country,name,identity,data,public_key, (SELECT COUNT(aps.identity) FROM aps WHERE identity = ?) AS amount FROM units WHERE identity = ? LIMIT 1",
            [ req.params.fingerprint, req.params.fingerprint ],
            function(err, results) {
                if (err) {
                    console.log(err);
                    res.status(500).json({"error":"Internal Server Error"});
                    return;
                }
                if (results.length === 0) {

                    res.status(200).json({"error":"Not Found"});
                    return;
                }
                res.send(JSON.stringify(results[0]));
            });
    });

    // Via pwngrid binary
    app.get("/api/v1/unit/:fingerprint", utils.authenticate, (req, res) => {
        // got unit search
        // https://pwnagotchi.ai/api/grid/#get-api-v1-unit-fingerprint
        console.log("Got unit search for " + req.params.fingerprint);
        // Query fingerprint via mysql
        connection.query("SELECT created_at,updated_at,country,name,identity,data,public_key FROM units WHERE identity = ?",
            [ req.params.fingerprint ],
            function(err, results) {
                if (err) {
                    console.log(err);
                    res.status(500).json({"error":"Internal Server Error"});
                    return;

                }
                if (results.length === 0) {

                    res.status(404).json({"error":"Not Found"});
                    return;
                }
                res.send(JSON.stringify(results[0]));
            });
    });

    // Get message by id.
    app.get("/api/v1/unit/inbox/:messageId", utils.authenticate, (req, res) => {
        if (res.locals.authorised) {
            connection.query("SELECT created_at,updated_at,seen_at,deleted_at,sender,sender_name,data,signature,id FROM messages WHERE id = ? AND receiver = ?",
                [ req.params.messageId, res.locals.author.unit_ident[1] ],
                function(err, results) {
                    if (err) {
                        console.log(err);
                        res.status(500).json({"error":"Internal Server Error"});
                        return;
                    }
                    res.send(results[0]);
                });
        } else {
            res.status(401).json({"error":"Unauthorised request"});
        }
    });

    // Mark a message
    app.get("/api/v1/unit/inbox/:messageId/:mark", utils.authenticate, (req, res) => {
        console.log("Got: /api/v1/unit/inbox/:messageId/:mark");
        console.log(req.params.messageId, req.params.mark);
        if (req.params.mark === "seen") {
        // mark message seen
            connection.query("UPDATE messages SET seen_at = CURRENT_TIMESTAMP WHERE id = ? AND receiver = ?",
                [ req.params.messageId, res.locals.author.unit_ident[1] ],
                function(err) {
                    if (err) {
                        console.error(err);
                        res.status(500).json({"error":"Internal Server Error"});
                        return;
                    }
                    console.log("Updated Message");
                    res.status(200).json({"status":"success"});
                    return;
                });
        } else if (req.params.mark === "deleted") {
            connection.query("DELETE FROM  messages WHERE id = ? AND receiver = ?",
                [ req.params.messageId, res.locals.author.unit_ident[1] ],
                function(err) {
                    if (err) {
                        console.error(err);
                        res.status(500).json({"error":"Internal Server Error"});
                        return;
                    }
                    console.log("Updated Message");
                    res.status(200).json({"status":"success"});
                    return;
                });
        } else if (req.params.mark === "unseen") {
            connection.query("UPDATE messages SET seen = NULL WHERE id = ? AND receiver = ?",
                [ req.params.messageId, res.locals.author.unit_ident[1] ],
                function(err) {
                    if (err) {
                        console.error(err);
                        res.status(500).json({"error":"Internal Server Error"});
                        return;
                    }
                    console.log("Updated Message");
                    res.status(200).json({"status":"success"});
                    return;
                });
        } else {
            res.status(401).json({"error":"Unauthorised request"});
            console.log("Unauthed Request to send a message");
            return;
        }
    });

    // send a message
    app.post("/api/v1/unit/:fingerprint/inbox", utils.toJson, utils.authenticate, (req, res) => {
        if (res.locals.authorised) {
            connection.query("INSERT INTO messages (receiver,sender_name,sender,data,signature) VALUES (?,?,?,?,?)",
                [ req.params.fingerprint, res.locals.author.unit_ident[0], res.locals.author.unit_ident[1], req.body.data, req.body.signature ],
                function(err) {
                    if (err) {
                        console.error(err);
                        res.status(500).json({"error":"Internal Server Error"});
                        return;
                    }
                    res.status(200).json({"status":"success"});
                    return;
                });
        } else {
            res.status(401).json({"error":"Unauthorised request"});
            console.log("Unauthed Request to send a message");
            return;
        }
    });
};