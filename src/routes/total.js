const express = require('express')
const db = require('../db')
const logger = require('../logger')('routes-total')

const router = express.Router()

// Base endpoint: /api/v1/total
router.get('/', (req, res) => {
  db.units.total((err, total) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    res.send(total)
  })
})

router.get('/aps', (req, res) => {
  db.accessPoints.total((err, total) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }

    res.send(total)
  })
})

module.exports = router
