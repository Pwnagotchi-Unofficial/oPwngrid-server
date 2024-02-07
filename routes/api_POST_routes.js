const updateToken = require('../utils/token.js')
const crypto = require('crypto')
require('dotenv').config()
const utils = require('../utils/helpers.js')
const db = require('../db')

module.exports = function (app) {
  // enroll post
  app.post('/api/v1/unit/enroll', utils.toJson, (req, res) => {
    // enroll sends
    // enrollment := map[string]interface{}{
    //  "identity":   identity,
    //  "public_key": pubKeyPEM64,
    //  "signature":  signature64,
    //  "data":       c.data,
    // }
    console.log('Enroll from: ' + req.body.identity)

    if (!req.body.identity && !req.body.public_key && !req.body.signature) {
      res.status(422).json({ error: 'invalid body format' })
      return
    }

    const identity = req.body.identity.split('@')

    // Before we enroll we want to check the device follows our methods of verifying identity
    let pubKey = Buffer.from(req.body.public_key, 'base64').toString()
    const KeyString = pubKey.split('RSA ').join('')
    const result = crypto.verify(
      'rsa-sha256',
      new TextEncoder().encode(req.body.identity),
      {
        key: KeyString,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING
      },
      Buffer.from(req.body.signature, 'base64'))

    if (!result) {
      console.warn('Signature is NOT valid. A device has attempted to enroll that cannot verify its self.')
      res.status(401).json({ error: 'signature is invalid' })
      return
    } else if (result) {
      console.log('Signature is valid. continuing')
    } else {
      console.error('Result is not true or false, how does this work?')
      res.status(401).json({ error: 'signature is invalid' })
      return
    }
    // check if unit is already in our database
    db.units.search(identity[1], (err, units) => {
      if (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
        return
      }
      if (units.length === 0) {
        console.log('Enrolling New')
        let country = 'XX'
        let addr = null
        let data = {}

        pubKey = Buffer.from(req.body.public_key, 'base64').toString()
        if (req && req.headers && req.headers['x-forwarded-for']) {
          addr = req.headers['x-forwarded-for']
        } else {
          console.warn('Error: X-Forwarded-For header is missing or undefined')
          addr = null
        }
        if (req && req.headers && req.headers['cf-ipcountry']) {
          country = req.headers['cf-ipcountry']
        } else {
          console.warn('Error: CF-IpCountry header is missing or undefined')
          country = 'XX'
        }
        if (req && req.body && req.body.data) {
          data = req.body.data
        } else {
          console.warn('Error: data is missing or undefined')
          data = {}
        }
        db.units.add(identity[0], identity[1], pubKey, addr, country, JSON.stringify(data), (results) => {
          res.status(200).send(JSON.stringify({ token: updateToken(identity, results.insertId) }))
          console.log('Enrolled new')
        })
      } else if (units.length === 1) {
        let data = {}
        if (req && req.body && req.body.data) {
          data = req.body.data
        } else {
          console.error('Error: data is missing or undefined')
          data = {}
        }
        db.units.update(identity[1], identity[0], JSON.stringify(data), (err) => {
          if (err) {
            console.error(err)
            res.status(500).json({ error: 'Internal Server Error' })
            return
          }
          console.log('Updating enrollee: ' + identity[1])
        })
        // TODO: should be removed
        res.status(200).send(JSON.stringify({ token: updateToken(identity, units.insertId) }))
      } else if (units.length > 1) {
        console.log('Tried to enroll, but database return error or more than 1 match')
        res.status(500).json({ error: 'Internal Server Error. Please report this to @rai68 asap, as a id_rsa has been matched, which doesnt make sense.' })
      }
    })
  })

  // send APs Posts
  app.post('/api/v1/unit/report/ap', utils.toJson, utils.authenticate, (req, res) => {
    console.log('AP incoming')

    if (res.locals.authorised === false) {
      console.warn('Warning | Unauthorised device tried to send AP')
      res.status(401).json({ error: 'Unauthorised request' })
      return
    }
    if (!req.body.bssid && !req.body.essid) {
      res.status(422).json({ error: 'Invalid body format' })
      return
    }

    // Check if BSSID has been reported before
    db.accessPoints.search(req.body.bssid, (err, aps) => {
      if (err) {
        console.log(err)
        res.status(500).json({ error: 'Internal Server Error' })
        return
      }
      console.log('Lets see if its been reported before')
      console.log(aps.length)
      // If results is 0, the ap doesnt exist, but if its 1 or more, multiple devices have reported it.
      if (aps.length >= 1) {
        let reported = false
        for (const ap of aps) {
          if (ap.identity === res.locals.author.unit_ident[1]) {
            reported = true
            break
          }
        }
        if (reported === false) {
          console.log('AP has not been reported before from this identity')
          // unit has not reported the AP before so continue to add it to db
          // add stuff here to include the AP even if its been reported, not sure how, maybe an array. Ok so now is adding another row for the same AP
          db.accessPoints.add(req.body.bssid, req.body.essid, res.locals.author.unit_ident[1], (err) => {
            if (err) {
              // Handle the error, but don't send a response here
              console.error(err)
              res.status(500).json({ error: 'Internal Server Error' })
              return
            }
            // Send a response when the insertion is successful
            res.status(200).json({ status: 'success' })
          })
        } else {
          console.log('It has been reported sending 200, but not storing it again')
          res.status(200).json({ status: 'success' })
        }
      } else if (aps.length === 0) {
        console.log('it hasnt been reported before')
        // Because no APs exist with that SSID, add it to the database.
        db.accessPoints.add(req.body.bssid, req.body.essid, res.locals.author.unit_ident[1], (err) => {
          if (err) {
            // Handle the error, but don't send a response here
            console.error(err)
            res.status(500).json({ error: 'Internal Server Error' })
            return
          }
          // Send a response when the insertion is successful
          console.log('sending 200 for a new AP')
          res.status(200).json({ status: 'success' })
        })
      }
    })
  })

  app.post('/api/v1/unit/report/aps', utils.toJson, utils.authenticate, (req, res) => {
    console.log('AP received')
    if (res.locals.authorised === false) {
      console.warn('Warning | Unauthorised device tried to send AP')
      res.status(401).json({ error: 'Unauthorised request' })
      return
    }
    req.body.forEach(function (ap) {
      db.accessPoints.search(ap.bssid, (err, aps) => {
        if (err) {
          console.log(err)
          res.status(500).json({ error: 'Internal Server Error' })
          return
        }
        // console.log("Lets see if its been reported before");
        // If results is 0, the ap doesnt exist, but if its 1 or more, multiple devices have reported it.
        if (aps.length >= 1) {
          let reported = false
          for (const element of aps) {
            if (element.identity === res.locals.author.unit_ident[1]) {
              reported = true
              break
            }
          }
          if (reported === false) {
            console.log('AP has not been reported before from this identity')
            // unit has not reported the AP before so continue to add it to db
            // add stuff here to include the AP even if its been reported, not sure how, maybe an array. Ok so now is adding another row for the same AP
            db.accessPoints.add(ap.bssid, ap.essid, res.locals.author.unit_ident[1], (err) => {
              if (err) {
                // Handle the error, but don't send a response here
                // console.error(err);
                res.status(500).json({ error: 'Internal Server Error' })
                return
              }
              // Send a response when the insertion is successful
              res.status(200).json({ status: 'success' })
            })
          } else {
            // console.log("It has been reported sending 200, but not storing it again");
            res.status(200).json({ status: 'success' })
          }
        } else if (aps.length === 0) {
          // console.log("it hasnt been reported before");
          // Because no APs exist with that SSID, add it to the database.
          db.accessPoints.add(ap.bssid, ap.essid, res.locals.author.unit_ident[1], (err) => {
            if (err) {
              // Handle the error, but don't send a response here
              console.error(err)
              res.status(500).json({ error: 'Internal Server Error' })
              return
            }
            // Send a response when the insertion is successful
            console.log('sending 200 for a new AP')
            res.status(200).json({ status: 'success' })
          })
        }
      })
    })
  })

  app.post('/api/v1/unit/:fingerprint/inbox', utils.toJson, utils.authenticate, (req, res) => {
    if (res.locals.authorised === false) {
      console.warn('Warning | Unauthorised device tried to send MESSAGEP')
      res.status(401).json({ error: 'Unauthorised request' })
      return
    }

    db.inbox.add(req.params.fingerprint, res.locals.author.unit_ident[0], res.locals.author.unit_ident[1], req.body.data, req.body.signature, (err) => {
      if (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
        return
      }
      res.status(200).json({ status: 'success' })
    })
  })
}
