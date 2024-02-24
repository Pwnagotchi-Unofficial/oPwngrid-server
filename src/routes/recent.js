const express = require('express')
const db = require('../db')
const logger = require('../logger')('routes-recent')

const router = express.Router()

// Base endpoint: /api/v1/recent
router.get('/', (req, res) => {
  db.units.recent((err, units) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    res.send(units)
  })
})
module.exports = router
