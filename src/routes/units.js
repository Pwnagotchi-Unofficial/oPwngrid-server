const express = require('express')

const router = express.Router()

// Base endpoint: /api/v1/units
router.get('/', (req, res) => {
  // TODO: implement
  res.send('Custom API for a new pwn system')
})

router.get('/by_country', (req, res) => {
  // TODO: implement
  res.send('Custom API for a new pwn system')
})

module.exports = router
