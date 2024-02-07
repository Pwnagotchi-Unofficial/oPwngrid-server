require('dotenv').config()
const utils = require('../utils/helpers.js')

const db = require('../db')

// for tracking uptime
const startTime = Date.now()

module.exports = function (app) {
  // uptime keeper
  app.get('/api/v1/uptime', (req, res) => {
    const time = Date.now() - startTime
    res.json({ isUp: true, uptime: time })
  })

  app.get('/api/v1/units', (req, res) => {
    // TODO: implement
    res.send('Custom API for a new pwn system')
  })

  app.get('/api/v1/units/by_country', (req, res) => {
    // TODO: implement
    res.send('Custom API for a new pwn system')
  })

  app.get('/api/v1/total', (req, res) => {
    // TODO: Preferably move to ORM
    db.units.total((err, total) => {
      if (err) {
        res.status(500).json({ error: 'Internal Server Error' })
        console.log(err)
        return
      }
      res.send(total)
    })
  })

  app.get('/api/v1/total/aps', (req, res) => {
    db.accessPoints.total((err, total) => {
      if (err) {
        res.status(500).json({ error: 'Internal Server Error' })
        console.log(err)
        return
      }

      res.send(total)
    })
  })

  app.get('/api/v1/recent', (req, res) => {
    db.units.recent((err, units) => {
      if (err) {
        res.status(500).json({ error: 'Internal Server Error' })
        console.log(err)
        return
      }
      res.send(units)
    })
  })

  app.get('/api/v1/unit/inbox/', utils.authenticate, (req, res) => {
    console.log('Got /api/v1/unit/inbox/')
    if (res.locals.authorised === false) {
      console.warn('Unauthorised request to mailbox')
      res.status(401).json({ error: 'token expired or cannot be authenticated' })
      return
    }

    const limit = 10
    // this value equals the limit per page on a pwnas web interface
    db.inbox.totalMessages(res.locals.author.unit_ident[1], (err, count) => {
      if (err) {
        console.log(err)
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
          console.log(err)
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

  // Searching for a unit
  // via web search api
  app.get('/api/v1/search/:fingerprint', utils.authenticate, (req, res) => {
    // got unit search
    // https://pwnagotchi.ai/api/grid/#get-api-v1-unit-fingerprint
    console.log('Got web search for ' + req.params.fingerprint)
    // Query fingerprint via mysql
    db.units.webSearch(req.params.fingerprint, (err, unit) => {
      if (err) {
        console.log(err)
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

  // Via pwngrid binary
  app.get('/api/v1/unit/:fingerprint', utils.authenticate, (req, res) => {
    // got unit search
    // https://pwnagotchi.ai/api/grid/#get-api-v1-unit-fingerprint
    console.log('Got unit search for ' + req.params.fingerprint)
    // Query fingerprint via mysql
    db.units.gridSearch(req.params.fingerprint, (err, unit) => {
      if (err) {
        console.log(err)
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

  // Get message by id.
  app.get('/api/v1/unit/inbox/:messageId', utils.authenticate, (req, res) => {
    if (res.locals.authorised) {
      db.inbox.message(req.params.messageId, res.locals.author.unit_ident[1], (err, message) => {
        if (err) {
          console.log(err)
          res.status(500).json({ error: 'Internal Server Error' })
          return
        }

        if (!message) { res.status(404).json({ error: 'Not Found' }) } else { res.json(message) }
      })
    } else {
      res.status(401).json({ error: 'Unauthorised request' })
    }
  })

  // Mark a message
  app.get('/api/v1/unit/inbox/:messageId/:mark', utils.authenticate, (req, res) => {
    console.log('Got: /api/v1/unit/inbox/:messageId/:mark')
    console.log(req.params.messageId, req.params.mark)
    if (req.params.mark === 'seen') {
      // mark message seen
      db.inbox.markMessageSeen(req.params.messageId, res.locals.author.unit_ident[1], (err) => {
        if (err) {
          console.error(err)
          res.status(500).json({ error: 'Internal Server Error' })
          return
        }
        console.log('Updated Message')
        res.status(200).json({ status: 'success' })
      })
    } else if (req.params.mark === 'deleted') {
      db.inbox.deleteMessage(req.params.messageId, res.locals.author.unit_ident[1], (err) => {
        if (err) {
          console.error(err)
          res.status(500).json({ error: 'Internal Server Error' })
          return
        }
        console.log('Updated Message')
        res.status(200).json({ status: 'success' })
      })
    } else if (req.params.mark === 'unseen') {
      db.inbox.markMessageUnseen(req.params.messageId, res.locals.author.unit_ident[1], (err) => {
        if (err) {
          console.error(err)
          res.status(500).json({ error: 'Internal Server Error' })
          return
        }
        console.log('Updated Message')
        res.status(200).json({ status: 'success' })
      })
    } else {
      res.status(401).json({ error: 'Unauthorised request' })
      console.log('Unauthed Request to send a message')
    }
  })
}
