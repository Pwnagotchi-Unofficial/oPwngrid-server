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

// setup depending on dev and prod, like strict domain checking etc
if (process.env.ENVIROMENT === 'dev') {
  // dev enviroment
  app.get('*', function (req, res, next) {
    // if it's a sub-domain
    next()
  })
} else {
  // prod enviroment
  app.use(cors({ origin: ['https://opwngrid.xyz', 'https://api.opwngrid.xyz'] }))

  app.get('*', function (req, res, next) {
    // if it's a sub-domain
    if (req.headers.host === 'opwngrid.xyz') {
      if (req.url.includes('/api/')) {
        res.send('API not here')
        return
      } else {
        // next();
        return
      }
    } else if (req.headers.host === 'api.opwngrid.xyz') {
      if (req.url.includes('/api/')) {
        next()
        return
      } else {
        res.status(404).json({ error: 'Not Found' })
        return
      }
    }
    res.status(404).json({ error: 'Not Found' })
  })
}

app.use('/api/v1/units', routes.units)
app.use('/api/v1/unit', routes.unit)
app.use('/api/v1/uptime', routes.uptime)
app.use('/api/v1/total', routes.total)
app.use('/api/v1/recent', routes.recent)
app.use('/api/v1/search', routes.search)
app.use('/api/statistics', routes.statistics) // TODO: doesn't follow APIs logic -> should be changed to /api/v1/statistics

// App Listen ---------------------------
app.listen(port, () => {
  console.log(`[WEB] listening on port ${port}`)
})
