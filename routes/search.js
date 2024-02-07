const express = require('express')
const db = require('../db')
const utils = require('../utils/helpers')

const router = express.Router()

// Base endpoint: /api/v1/search
router.get('/:fingerprint', utils.authenticate, (req, res) => {
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

module.exports = router
