
const bodyParser = require('body-parser')
const express = require('express')
require("dotenv").config();
const app = express()
const cors = require('cors');
const port = process.env.PORT
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB,
    password: process.env.DB_PASS
  });
const jwt = require('jsonwebtoken');
const updateToken = require("./utils/token.js")
const crypto = require('crypto');
const startTime = Date.now()
//API Gets
//app.use(express.json())
function log(req, res, next) {
    console.log("Got a request type: " + req.method)
    console.warn("Got: " + req.originalUrl)
    //console.log(req.headers)
    next()
  }




app.use(log)
app.use(cors({ origin: 'https://opwngrid.xyz' }));


function toJson(req, res, next) {
    if(req.body == undefined) {
      let buffer = []
      req.on('data', function onRequestData(chunk) {
        buffer.push(chunk)
      });
  
      req.once('end', function() {
        let concated = Buffer.concat(buffer);
        //console.log(concated.toString('utf8'))
        req.body = JSON.parse(concated.toString('utf8'));
        next()
      });
    } else {
      next();
      return;
    }
  }

function authenticate(req, res, next) {
  if (!req.headers.authorization) {
    res.locals.authorised = false
		console.warn("Warning : unauthenticated request from ")
    next()
    return;
	} else {
  token = req.headers.authorization.slice("Bearer ".length)
  if (token.length >= 63) {
    console.warn("Warning : authenticated request from ")
    try {
      decoded = jwt.verify(token, process.env.SECRET);
    } catch (err) {
      console.log(err)
      res.status(401).json({"error":"token expired or cannot be authenticated"})
      return;
    }
    //create a check to see if token is expired
    if (decoded.authorized == true) {
    res.locals.authorised = true
    } else if (decoded.authorized == false) {
      res.locals.authorised = false
    }
    res.locals.author = decoded
    next()
    return;
  }
  res.locals.authorised = false
  console.warn("Warning : unauthenticated request from ")
  next()
  return;
  }
}

app.get('*', function(req, res, next){ 
  if(req.headers.host == 'opwngrid.xyz') { //if it's a sub-domain
    if (req.url.includes("/api/")) {
      res.send("API not here")
      return;
    } 
  } else if (req.headers.host == 'api.opwngrid.xyz') {
    if (req.url.includes("/api/v1/")) {
      next(); 
    } else {
      res.status(404).json({"error":"Not Found"})
      return;
    }
  } 
  next(); 
});



app.use(express.static(__dirname + '/public'));
//routing for main website

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
})
app.get('/search/*', (req, res) => {
  res.sendFile(__dirname + `/public/search.html`);
})
app.get('/convert', (req, res) => {
  res.sendFile(__dirname + `/public/convert.html`);
})

//----------------------------------------------------------------------------
//Start of statistic APIs
app.get('/api/v1/uptime', (req,res) => {
  let time = Date.now() - startTime
  res.json({isUp:true,uptime:time})
})
app.get('/api/v1/units', (req, res) => {
    res.send('Custom API for a new pwn system')
  })

app.get('/api/v1/units/by_country', (req, res) => {
    res.send('Custom API for a new pwn system')
  })

  app.get('/api/v1/total', (req, res) => {
    
    connection.query('SELECT COUNT(ID) AS total, COUNT(DISTINCT SUBSTRING_INDEX(country, \',\', -1)) AS countries FROM units',
    function(err, results, fields) {
      if (err) {
        res.status(500).json({"error":"Internal Server Error"})
        console.log(err)
        return;
      }
      res.send(results[0])
    })
    return
  })
app.get('/api/v1/total/aps', (req, res) => {
  
  connection.query('SELECT COUNT(ID) AS total FROM aps',
  function(err, results, fields) {
    if (err) {
      res.status(500).json({"error":"Internal Server Error"})
      console.log(err)
      return;
    }
    res.send(results[0])
  })
  return
})
app.get('/api/v1/recent', (req, res) => {
  
  connection.query('SELECT name,data,created_at,country,identity FROM units WHERE created_at >= NOW() - INTERVAL 1 YEAR ORDER BY created_at DESC LIMIT 10',
  function(err, results, fields) {
    if (err) {
      res.status(500).json({"error":"Internal Server Error"})
      console.log(err)
      return;
    }
    res.send(results)
  })
  return
})


//End of statisics



//Searching for a unit + allow a unit to get mail box
app.get('/api/v1/unit/:fingerprint', authenticate, (req, res) => {
  if (req.params.fingerprint === 'inbox') {
    console.log("Got /api/v1/unit/:Inbox")
    if (res.locals.authorised === false) {
      res.status(401).json({"error":"Unauthorised request"})
      return
    }
    limit = 10
    
    console.log(res.locals.author)
    //A mail box search has init
    
    connection.query('SELECT created_at,updated_at,deleted_at,seen_at,sender,sender_name,id FROM messages WHERE receiver = ? ',
    [res.locals.author.unit_ident[1]],
    function(err, results, fields) {
      if (err) {
        console.log(err)
        res.status(500).json({"error":"Internal Server Error"})
        return
      }
      console.log("total messages for unit: "+results.length)
      
      let offset = 0
      if (req.query.p === 1) {
        offset = 0
        pages = Math.ceil(results.length / limit)
      } else {
        offset = (req.query.p * limit) - limit
        pages = Math.ceil(results.length / limit)
      }
      connection.query('SELECT created_at,updated_at,deleted_at,seen_at,sender,sender_name,data,signature,id FROM messages WHERE receiver = ? LIMIT ? OFFSET ?',
      [res.locals.author.unit_ident[1],limit,offset],
      function(err, results, fields) {
        if (err) {
          console.log(err)
          res.status(500).json({"error":"Internal Server Error"})
          return
        }
      //Create the pages system pwngrid uses
        messages = {
          "pages": (pages),//pages
          "records":results.length,
          "messages": results
        }
        res.send(JSON.stringify(messages))
    })
    



    })

//SWAP BETWEEENNN MAIL BOX AND UNIT SEARCH

  } else {
    //got unit search
    //https://pwnagotchi.ai/api/grid/#get-api-v1-unit-fingerprint
    console.log('Got unit search for ' + req.params.fingerprint)
    //Query fingerprint via mysql
    connection.query('SELECT created_at,updated_at,country,name,identity,data,public_key FROM units WHERE identity = ?',
    [req.params.fingerprint],
    function(err, results, fields) {
      if (err) {
        console.log(err)
      }
      console.log(results[0])
      if (results.length === 0) {
        res.status(404).json({"error":"Not Found"})
        return
      }
      res.send(JSON.stringify(results[0]))
    })
  }
})
//Get message by id.
app.get('/api/v1/unit/inbox/:messageId', authenticate, (req,res) => {
  if (res.locals.authorised) {
  
  connection.query('SELECT created_at,updated_at,seen_at,deleted_at,sender,sender_name,data,signature,id FROM messages WHERE id = ? AND receiver = ?',
  [req.params.messageId, res.locals.author.unit_ident[1]],
  function(err, results, fields) {
    if (err) {
      console.log(err)
    }
    res.send(results[0])
  })
} else {
  res.status(401).json({"error":"Unauthorised request"})
}
})
//Mark a message



app.get('/api/v1/unit/inbox/:messageId/:mark', authenticate, (req,res) => {
  console.log("Got: /api/v1/unit/inbox/:messageId/:mark")
  console.log(req.params.messageId,req.params.mark)
  if (req.params.mark === 'seen') {
    //mark message seen
    connection.query('UPDATE messages SET seen_at = CURRENT_TIMESTAMP WHERE id = ? AND receiver = ?',
    [req.params.messageId,res.locals.author.unit_ident[1]],
        function(err, results, fields) {
          if (err) {
            console.error(err)
            res.status(500).json({"error":"Internal Server Error"})
            return;
          }
          console.log("Updated Message")
          res.status(200).json({"status":"success"})
        })
      } else if (req.params.mark === 'deleted') {
        
        connection.query('DELETE FROM  messages WHERE id = ? AND receiver = ?',
        [req.params.messageId,res.locals.author.unit_ident[1]],
            function(err, results, fields) {
              if (err) {
                console.error(err)
                res.status(500).json({"error":"Internal Server Error"})
                return;
              }
              console.log("Updated Message")
              res.status(200).json({"status":"success"})
            })
      
      } else if (req.params.mark === 'unseen') {
        
        connection.query('UPDATE messages SET seen = NULL WHERE id = ? AND receiver = ?',
        [req.params.messageId,res.locals.author.unit_ident[1]],
            function(err, results, fields) {
              if (err) {
                console.error(err)
                res.status(500).json({"error":"Internal Server Error"})
                return;
              }
              console.log("Updated Message")
              res.status(200).json({"status":"success"})
            })
      
      } else {
        res.status(401).json({"error":"Unauthorised request"})
        console.log("Unauthed Request to send a message")
        return;
      }
    })
//send a message
app.post('/api/v1/unit/:fingerprint/inbox',toJson, authenticate, (req,res) => {
  if (res.locals.authorised) {
        
        connection.query('INSERT INTO messages (receiver,sender_name,sender,data,signature) VALUES (?,?,?,?,?)',
        [req.params.fingerprint,res.locals.author.unit_ident[0],res.locals.author.unit_ident[1],req.body.data,req.body.signature],
            function(err, results, fields) {
              if (err) {
                console.error(err)
                res.status(500).json({"error":"Internal Server Error"})
                return;
              }
              res.status(200).json({"status":"success"})
            })
          } else {
            res.status(401).json({"error":"Unauthorised request"})
            console.log("Unauthed Request to send a message")
            return;
          }
        })
      
//API Posts
//-----------------------------------------------------------------------------
//enroll post
app.post('/api/v1/unit/enroll', toJson, (req,res) => {
    //enroll sends
    // enrollment := map[string]interface{}{
	// 	"identity":   identity,
	// 	"public_key": pubKeyPEM64,
	// 	"signature":  signature64,
	// 	"data":       c.data,
	// }
    console.log("Enroll from: " + req.body.identity) 
    identity = req.body.identity.split("@")
    // Before we enroll we want to check the device follows our methods of verifying identity 
    pub_key = Buffer.from(req.body.public_key, "base64").toString()
    KeyString = pub_key.split('RSA ').join('')
    let KeyObject = crypto.createPublicKey({ key: KeyString, format: 'pem' });
    const result = crypto.verify(
    'rsa-sha256',
    new TextEncoder().encode(req.body.identity),
    {
            key: KeyString,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING
    },
    Buffer.from(req.body.signature, 'base64'));

    if (!result) {
      console.warn('Signature is NOT valid. A device has attempted to enroll that cannot verify its self.');
      return;
    } else if (result) {
      console.log('Signature is valid. continuing');
    } else {
      console.error("Result is not true or false, how does this work?")
    }

    
    //check if unit is already in our database
    
    connection.query('SELECT * from units WHERE identity = ?',
    [identity[1],identity[0]],
        function(err, results, fields) {
            if (err) {
                console.log(err)
                res.status(500).json({"error":"Internal Server Error"})
                return
            } 
            if (results.length == 0) {
                console.log("Enrolling New")
                let country = "XX"
                let addr = null
                let data = {}

                pub_key = Buffer.from(req.body.public_key, "base64").toString();
                if (req && req.headers && req.headers['x-forwarded-for']) {
                  addr = req.headers['x-forwarded-for'];
                } else {
                  // Handle the case where req or req.headers or req.headers['x-forwarded-for'] is null or undefined
                  console.warn("Error: X-Forwarded-For header is missing or undefined");
                  addr = null; 
                }
                if (req && req.headers && req.headers['cf-ipcountry']) {
                  country = req.headers['cf-ipcountry'];
                } else {
                  console.warn("Error: CF-IpCountry header is missing or undefined");
                  country = "XX";
                }
                if (req && req.body && req.body.data) {
                  data = req.body.data
                } else {
                  console.warn("Error: data is missing or undefined");
                  data = {}
                }

                connection.query('INSERT INTO units (name,identity,public_key,address,country,data) VALUES (?,?,?,?,?,?)',
                [identity[0], identity[1],pub_key,addr,country,JSON.stringify(data)],
                function(err, results, fields) {
                    res.status(200).send(JSON.stringify({ "token": updateToken(identity,results.insertId) }));
                    console.log("Enrolled new")
                    return
                }
            );
            } else if (results.length == 1) {

                data = {}
                if (req && req.body && req.body.data) {
                  data = req.body.data
                } else {
                  console.error("Error: data is missing or undefined");
                  data = {}
                }
                connection.query('UPDATE units SET data=?, updated_at = CURRENT_TIMESTAMP, name = ? WHERE identity = ? LIMIT 1',
                [JSON.stringify(data),identity[0], identity[1]],
                function(err, results, fields) {
                    console.error(err)
                    if (err) {
                      console.error(err)
                      res.status(500).json({"error":"Internal Server Error"})
                      return
                    }
                    console.log("Updating enrollee: " + identity[1])
                    return
                })
                res.status(200).send(JSON.stringify({ "token": updateToken(identity,results.insertId) }));
              } else if (results.length > 1) {
                console.log('Tried to enroll, but database return error or more than 1 match')
                res.status(500).json({"error":"Internal Server Error"})
                return;
              }
        })
    


})
//send APs Posts
app.post('/api/v1/unit/report/ap', toJson, authenticate, (req, res) => {
  console.log("AP received");
  if (res.locals.authorised === false) {
    console.warn("Warning | Unauthorised device tried to send AP")
    res.status(401).json({"error":"Unauthorised request"})
    return;
  }
  // Check if BSSID has been reported before
  
  connection.query('SELECT bssid, essid FROM aps WHERE bssid = (UNHEX(REPLACE(?, \':\',\'\' )))',
    [req.body.bssid],
    function(err, results, fields) {
      if (err) {
        console.log(err)
      }
      // If results is 0, it exists, so send OK
      if (results.length == 1) {
        console.log('Received existing AP');
        console.log(results.length);
        res.status(200).json({"status":"success"})
        return;
      } else if (results.length >= 0) {
        console.log('Received new AP');
        // Because no APs exist with that SSID, add it to the database.
        connection.query('INSERT INTO aps (bssid, essid, identity, time) VALUES (UNHEX(REPLACE(?, \':\',\'\' )), ?,?, CURRENT_TIMESTAMP)',
          [req.body.bssid, req.body.essid, res.locals.author.unit_ident[1]],
          function(err, results, fields) {
            if (err) {
              // Handle the error, but don't send a response here
              console.error(err);
              return;
            }
            // Send a response when the insertion is successful
            res.status(200).json({"status":"success"})
          }
        );
      }
    }
  );
});

app.post('/api/v1/unit/report/aps', toJson, authenticate, (req, res) => {
  console.log("AP received");
  if (res.locals.authorised === false) {
    console.warn("Warning | Unauthorised device tried to send AP")
    res.status(401).json({"error":"Unauthorised request"})
    return;
  }
  
  req.body.forEach(function(ap){
    
    connection.query('SELECT bssid, essid FROM aps WHERE bssid = (UNHEX(REPLACE(?, \':\',\'\' )))',
    [ap.bssid],
    function(err, results, fields) {
      if (err) {
        console.log(err)
      }
      // If results is 0, it exists, so send OK
      if (results.length == 1) {
        console.log('Received existing AP');
        console.log(results.length);
        res.status(200).json({"status":"success"})
        return;
      } else if (results.length >= 0) {
        console.log('Received new AP');
        // Because no APs exist with that SSID, add it to the database.
        connection.query('INSERT INTO aps (bssid, essid, identity, time) VALUES (UNHEX(REPLACE(?, \':\',\'\' )), ?,?, CURRENT_TIMESTAMP)',
          [ap.bssid, ap.essid, res.locals.author.unit_ident[1]],
          function(err, results, fields) {
            if (err) {
              // Handle the error, but don't send a response here
              console.error(err);
              return;
            }
            // Send a response when the insertion is successful
            res.status(200).json({"status":"success"})
          }
        );
      }
    }
  );
  })
});




process.on('SIGINT', function() {
  connection.end(function(err) {
    process.exit(err ? 1 : 0);
  });
});
//App Listen ---------------------------
app.listen(port, () => {
  console.log(`grid listening on port ${port}`)
})
