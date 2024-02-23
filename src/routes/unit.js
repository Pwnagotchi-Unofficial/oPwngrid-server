const express = require('express')
const updateToken = require('../utils/token.js')
const crypto = require('crypto')
const db = require('../db')
const authenticate = require('../middlewares').authenticate
const logger = require('../logger')('routes-unit')

const router = express.Router()

// Base endpoint: /api/v1/unit
router.get('/inbox', authenticate, (req, res) => {
  if (res.locals.authorised === false) {
    logger.warn('Unauthorised request to mailbox')
    res.status(401).json({ error: 'token expired or cannot be authenticated' })
    return
  }

  const limit = 10
  // this value equals the limit per page on a pwnas web interface
  db.inbox.totalMessages(res.locals.author.unit_ident[1], (err, count) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }

    if (!count) {
      count = 0
    }
    let page = req.query.p
    if (!page) {
      page = 1
    }
    let offset = 0
    if (page === 1) {
      offset = 0
    } else {
      offset = (page * limit) - limit
    }
    let pages = Math.ceil(count / limit)
    const records = count
    db.inbox.messages(res.locals.author.unit_ident[1], limit, offset, (err, messages) => {
      if (err) {
        logger.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
        return
      }
      // Create the pages system pwngrid uses
      pages = Math.ceil(records / limit)
      const response = {
        pages,
        records,
        messages
      }
      res.status(200).json(response)
    })
  })
})

router.get('/:fingerprint', authenticate, (req, res) => {
  // got unit search
  // https://pwnagotchi.ai/api/grid/#get-api-v1-unit-fingerprint
  logger.info('Got unit search for ' + req.params.fingerprint)
  // Query fingerprint via mysql
  db.units.gridSearch(req.params.fingerprint, (err, unit) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    if (!unit) {
      res.status(404).json({ error: 'Not Found' })
      return
    }
    res.json(unit)
  })
})

router.get('/inbox/:messageId', authenticate, (req, res) => {
  if (res.locals.authorised) {
    db.inbox.message(req.params.messageId, res.locals.author.unit_ident[1], (err, message) => {
      if (err) {
        logger.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
        return
      }

      if (!message) { res.status(404).json({ error: 'Not Found' }) } else { res.json(message) }
    })
  } else {
    res.status(401).json({ error: 'Unauthorised request' })
  }
})

router.get('/inbox/:messageId/:mark', authenticate, (req, res) => {
  if (req.params.mark === 'seen') {
    // mark message seen
    db.inbox.markMessageSeen(req.params.messageId, res.locals.author.unit_ident[1], (err) => {
      if (err) {
        logger.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
        return
      }
      logger.info('Updated Message')
      res.status(200).json({ status: 'success' })
    })
  } else if (req.params.mark === 'deleted') {
    db.inbox.deleteMessage(req.params.messageId, res.locals.author.unit_ident[1], (err) => {
      if (err) {
        logger.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
        return
      }
      logger.info('Updated Message')
      res.status(200).json({ status: 'success' })
    })
  } else if (req.params.mark === 'unseen') {
    db.inbox.markMessageUnseen(req.params.messageId, res.locals.author.unit_ident[1], (err) => {
      if (err) {
        logger.error(err)
        res.status(500).json({ error: 'Internal Server Error' })
        return
      }
      logger.info('Updated Message')
      res.status(200).json({ status: 'success' })
    })
  } else {
    res.status(401).json({ error: 'Unauthorised request' })
    logger.info('Unauthed Request to send a message')
  }
})

router.post('/enroll', (req, res) => {
  // enroll sends
  // enrollment := map[string]interface{}{
  //  "identity":   identity,
  //  "public_key": pubKeyPEM64,
  //  "signature":  signature64,
  //  "data":       c.data,
  // }

  logger.info('Enroll from: ' + req.body.identity)

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
    logger.warn('Signature is NOT valid. A device has attempted to enroll that cannot verify its self.')
    res.status(401).json({ error: 'signature is invalid' })
    return
  } else if (result) {
    logger.info('Signature is valid. continuing')
  } else {
    logger.error('Result is not true or false, how does this work?')
    res.status(401).json({ error: 'signature is invalid' })
    return
  }
  // check if unit is already in our database
  db.units.search(identity[1], (err, units) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    if (units.length === 0) {
      logger.info('Enrolling New')
      let country = 'XX'
      let addr = null
      let data = {}

      pubKey = Buffer.from(req.body.public_key, 'base64').toString()
      if (req && req.headers && req.headers['x-forwarded-for']) {
        addr = req.headers['x-forwarded-for']
      } else {
        logger.warn('Error: X-Forwarded-For header is missing or undefined')
        addr = null
      }
      if (req && req.headers && req.headers['cf-ipcountry']) {
        country = req.headers['cf-ipcountry']
      } else {
        logger.warn('Error: CF-IpCountry header is missing or undefined')
        country = 'XX'
      }
      if (req && req.body && req.body.data) {
        data = req.body.data
      } else {
        logger.warn('Error: data is missing or undefined')
        data = {}
      }
      db.units.add(identity[0], identity[1], pubKey, addr, country, JSON.stringify(data), (err, results) => {
        if (err) {
          logger.error(err)
          res.status(500).json({ error: 'Internal Server Error' })
          return
        }
        logger.info('Enrolled new')
        res.status(200).send(JSON.stringify({ token: updateToken(identity, results.insertId) }))
      })
    } else if (units.length === 1) {
      let data = {}
      if (req && req.body && req.body.data) {
        data = req.body.data
      } else {
        logger.error('Error: data is missing or undefined')
        data = {}
      }
      db.units.update(identity[1], identity[0], JSON.stringify(data), (err) => {
        if (err) {
          logger.error(err)
          res.status(500).json({ error: 'Internal Server Error' })
          return
        }
        logger.info('Updating enrollee: ' + identity[1])
      })
      // TODO: should be removed
      res.status(200).send(JSON.stringify({ token: updateToken(identity, units.insertId) }))
    } else if (units.length > 1) {
      logger.info('Tried to enroll, but database return error or more than 1 match')
      res.status(500).json({ error: 'Internal Server Error. Please report this to @rai68 asap, as a id_rsa has been matched, which doesnt make sense.' })
    }
  })
})

router.post('/report/ap', authenticate, (req, res) => {
  logger.info('AP incoming')

  if (res.locals.authorised === false) {
    logger.warn('Warning | Unauthorised device tried to send AP')
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
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    logger.info('Lets see if its been reported before')
    logger.info(aps.length)
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
        logger.info('AP has not been reported before from this identity')
        // unit has not reported the AP before so continue to add it to db
        // add stuff here to include the AP even if its been reported, not sure how, maybe an array. Ok so now is adding another row for the same AP
        db.accessPoints.add(req.body.bssid, req.body.essid, res.locals.author.unit_ident[1], (err) => {
          if (err) {
            // Handle the error, but don't send a response here
            logger.error(err)
            res.status(500).json({ error: 'Internal Server Error' })
            return
          }
          // Send a response when the insertion is successful
          res.status(200).json({ status: 'success' })
        })
      } else {
        logger.info('It has been reported sending 200, but not storing it again')
        res.status(200).json({ status: 'success' })
      }
    } else if (aps.length === 0) {
      logger.info('it hasnt been reported before')
      // Because no APs exist with that SSID, add it to the database.
      db.accessPoints.add(req.body.bssid, req.body.essid, res.locals.author.unit_ident[1], (err) => {
        if (err) {
          // Handle the error, but don't send a response here
          logger.error(err)
          res.status(500).json({ error: 'Internal Server Error' })
          return
        }
        // Send a response when the insertion is successful
        logger.info('sending 200 for a new AP')
        res.status(200).json({ status: 'success' })
      })
    }
  })
})

router.post('/report/aps', authenticate, (req, res) => {
  logger.info('AP received')
  if (res.locals.authorised === false) {
    logger.warn('Warning | Unauthorised device tried to send AP')
    res.status(401).json({ error: 'Unauthorised request' })
    return
  }
  db.accessPoints.searchMultiple(req.body, (err, aps) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    const bssids = aps.map(ap => Buffer.from(ap.bssid, 'binary').toString('utf-8'))

    const newAps = []
    for (const ap of req.body) {
      const reportedIndex = bssids.indexOf(Buffer.from(ap.bssid.replace(/:/g, ''), 'hex').toString('utf-8'))
      if (reportedIndex > -1) {
        if (aps[reportedIndex].identity !== res.locals.author.unit_ident[1]) {
          logger.info('AP has not been reported before from this identity')
          newAps.push(ap)
        }
      } else {
        logger.info('AP first time reported')
        newAps.push(ap)
      }
    }
    if (newAps.length > 0) {
      db.accessPoints.addMultiple(newAps, res.locals.author.unit_ident[1], (err) => {
        if (err) {
          logger.error(err)
          res.status(500).json({ error: 'Internal Server Error' })
          return
        }

        res.status(200).json({ status: 'success' })
      })
    } else { res.status(200).json({ status: 'success' }) }
  })
})

router.post('/:fingerprint/inbox', authenticate, (req, res) => {
  if (res.locals.authorised === false) {
    logger.warn('Warning | Unauthorised device tried to send MESSAGEP')
    res.status(401).json({ error: 'Unauthorised request' })
    return
  }

  db.inbox.add(req.params.fingerprint, res.locals.author.unit_ident[0], res.locals.author.unit_ident[1], req.body.data, req.body.signature, (err) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    res.status(200).json({ status: 'success' })
  })
})

module.exports = router
