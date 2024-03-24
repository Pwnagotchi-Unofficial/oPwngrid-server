const express = require('express')
const version = require('../VERSION.js')
const router = express.Router()

// Base endpoint: /api/v1/notices

router.get('/', (req, res) => {
  res.json()
})

module.exports = router
