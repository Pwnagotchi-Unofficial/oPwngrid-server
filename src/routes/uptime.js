const express = require('express')
const version = require('../VERSION.js')
const router = express.Router()

const startTime = Date.now()

// Base endpoint: /api/v1/uptime

router.get('/', (req, res) => {
  const time = Date.now() - startTime
  res.json({ isUp: true, uptime: time, version })
})

module.exports = router
