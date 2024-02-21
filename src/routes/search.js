const express = require('express')
const db = require('../db')
const authenticate = require('../middlewares').authenticate
const logger = require('../logger')('routes-search')

const router = express.Router()

// Base endpoint: /api/v1/search
router.get('/:fingerprint', authenticate, (req, res) => {
  // got unit search
  // https://pwnagotchi.ai/api/grid/#get-api-v1-unit-fingerprint
  logger.info('Got web search for ' + req.params.fingerprint)
  // Query fingerprint via mysql
  db.units.webSearch(req.params.fingerprint, (err, unit) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    if (!unit) {
      logger.info('Unit not found')
      res.status(404).json({ error: 'Not Found' })
      return
    }
    res.json(unit)
  })
})

module.exports = router
