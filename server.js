const express = require('express')
require('dotenv').config()
const app = express()
const cors = require('cors')
const utils = require('./utils/helpers.js')
const routes = require('./routes')
// custom logger

// get port on which service should be available from env
const port = process.env.PORT

console.log(`[START] enviroment: ${process.env.ENVIROMENT}`)

// use custom logger and set up CORS
app.use(utils.log)

if (process.env.NODE_ENV === 'production') { app.use(cors({ origin: ['https://opwngrid.xyz', 'https://api.opwngrid.xyz'] })) }

app.use('/api/v1/units', routes.units)
app.use('/api/v1/unit', routes.unit)
app.use('/api/v1/uptime', routes.uptime)
app.use('/api/v1/total', routes.total)
app.use('/api/v1/recent', routes.recent)
app.use('/api/v1/search', routes.search)
app.use('/api/statistics', routes.statistics) // FIXME: doesn't follow APIs logic -> should be changed to /api/v1/statistics

// 404 not found
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found'
  })
})

// App Listen ---------------------------
app.listen(port, () => {
  console.log(`[WEB] listening on port ${port}`)
})
