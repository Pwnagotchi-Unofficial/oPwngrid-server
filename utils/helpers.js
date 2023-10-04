require("dotenv").config();
const jwt = require("jsonwebtoken");

function toJson(req, res, next) {
    if(req.body == undefined) {
        let buffer = [];
        req.on("data", function onRequestData(chunk) {
            buffer.push(chunk);
        });
  
        req.once("end", function() {
            let concated = Buffer.concat(buffer);
            //console.log(concated.toString('utf8'))
            req.body = JSON.parse(concated.toString("utf8"));
            next();
        });
    } else {
        next();
        return;
    }
}

function authenticate(req, res, next) {
    if (!req.headers.authorization) {
        res.locals.authorised = false;
        console.warn("Warning : unauthenticated request");
        next();
        return;
    } else {
        token = req.headers.authorization.slice("Bearer ".length);
        if (token.length >= 63) {
            try {
                decoded = jwt.verify(token, process.env.SECRET);
            } catch (err) {
                console.log(err);
                console.log("Error Decoding sending 401");
                res.status(401).json({"error":"token expired or cannot be authenticated"});
                return;
            }
            //create a check to see if token is expired
            if (decoded.authorized == true) {
                res.locals.author = decoded;
                res.locals.authorised = true;
                console.warn("Warning : authenticated request from " + res.locals.author.unit_ident[1]);
            } else if (decoded.authorized == false) {
                console.warn("Warning : unauthenticated request from " + res.locals.author.unit_ident[1]);
                res.locals.authorised = false;
            }
            next();
            return;
        }
        res.locals.authorised = false;
        console.warn("Warning : unauthenticated request");
        next();
        return;
    }
}

module.exports = {toJson, authenticate};