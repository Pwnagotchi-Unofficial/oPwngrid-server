const express = require("express");

module.exports = function(app) {
    //routing for main website
    app.use(express.static(__dirname + "/public"));
    app.get("/", (req, res) => {
        res.sendFile(__dirname + "/public/index.html");
    });
    app.get("/search/*", (req, res) => {
        res.sendFile(__dirname + "/public/search.html");
    });
    app.get("/search", (req, res) => {
        res.sendFile(__dirname + "/public/search.html");
    });
    app.get("/convert", (req, res) => {
        res.sendFile(__dirname + "/public/convert.html");
    });
    app.get("/css/:file", (req, res) => {
        res.sendFile(__dirname + `/public/css/${req.params.file}`);
    });
    app.get("/leaderboard", (req, res) => {
        res.sendFile(__dirname + "/public/leaderboard.html");
    });
    app.get("/statistics", (req, res) => {
        res.sendFile(__dirname + "/public/statistics.html");
    });
};