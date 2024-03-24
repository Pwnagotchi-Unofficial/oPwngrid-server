const mysql = require('mysql2')
const config = require('../config').db

const db = mysql.createConnection(config)

db.connect((err) => {
  if (err) throw err
})

process.on('SIGINT', function () {
  db.end(function (err) {
    if (err) throw err
    process.exit(0)
  })
})

const queries = {
  units: {
    total (cb) {
      db.query("SELECT COUNT(ID) AS total, COUNT(DISTINCT SUBSTRING_INDEX(country, ',', -1)) AS countries FROM units", (err, result) => {
        if (err) {
          cb(err)
          return
        }

        cb(null, result[0])
      })
    },
    recent (cb) {
      db.query('SELECT name,data,created_at,country,identity FROM units WHERE created_at >= NOW() - INTERVAL 1 YEAR ORDER BY created_at DESC LIMIT 10', (err, result) => {
        if (err) {
          cb(err)
          return
        }

        cb(null, result)
      })
    },
    webSearch (fingerprint, cb) {
      db.query('SELECT created_at,updated_at,country,name,identity,data,public_key, (SELECT COUNT(aps.identity) FROM aps WHERE identity = ?) AS amount FROM units WHERE identity = ? LIMIT 1', [fingerprint, fingerprint], (err, result) => {
        if (err) {
          cb(err)
          return
        }
        if (result.length === 0) { cb(null, null) } else { cb(null, result[0]) }
      })
    },
    webSearchByName (nameR = null, limit = 10, cb) {
        nameR = nameR + "%"
        db.query('SELECT name,identity,country FROM units WHERE name LIKE ? LIMIT ?', [nameR, limit], (err, result) => {
          if (err) {
            cb(err)
            return
          }
          if (result.length === 0) { cb(null, null) } else { cb(null, result) }
          return
        })
    },
    gridSearch (fingerprint, cb) {
      db.query('SELECT created_at,updated_at,country,name,identity,data,public_key FROM units WHERE identity = ?', [fingerprint], (err, result) => {
        if (err) {
          cb(err)
          return
        }

        if (result.length === 0) { cb(null, null) } else { cb(null, result[0]) }
      })
    },
    search (fingerprint, cb) {
      // TODO: this can be merged with gridSearch
      // We could but this one is internal and isnt exposed
      db.query('SELECT * FROM units WHERE identity = ?', [fingerprint], cb)
    },
    add (name, identity, publicKey, address, country, data, cb) {
      db.query('INSERT INTO units (name,identity,public_key,address,country,data) VALUES (?,?,?,?,?,?)', [name, identity, publicKey, address, country, data], cb)
    },
    update (identity, name, data, cb) {
      db.query('UPDATE units SET data=?, updated_at = CURRENT_TIMESTAMP, name = ? WHERE identity = ? LIMIT 1', [data, name, identity], cb)
    },
    byCountry (country, limit=100, name = false,data=false, cb) {
      if (data) {
        if (name) {
          name = name + "%"
          db.query('SELECT * FROM units WHERE country = ? and name LIKE ? LIMIT ?', [country, name, limit], cb)
        } else {
          db.query('SELECT * FROM units WHERE country = ? LIMIT ?', [country, limit], cb)
        }
      } else {
        if (name) {
          name = name + "%"
          db.query('SELECT name,identity,country FROM units WHERE country = ? and name LIKE ? LIMIT ?', [country, name, limit], cb)
        } else {
          db.query('SELECT name,identity,country FROM units WHERE country = ? LIMIT ?', [country, limit], cb)
        }
      }
    },
    countries (cb) {
      db.query('select country from units group by country ', cb)
    }
  },
  accessPoints: {
    total (cb) {
      db.query('SELECT COUNT(ID) AS total FROM aps', (err, result) => {
        if (err) {
          cb(err)
          return
        }
        cb(null, result[0])
      })
    },
    search (bssid, cb) {
      db.query("SELECT bssid, essid, identity FROM aps WHERE bssid = (UNHEX(REPLACE(?, ':','' )))", [bssid], cb)
    },
    searchMultiple (aps, cb) {
      const rows = []
      for (const ap of aps) rows.push(Buffer.from(ap.bssid.replace(/:/g, ''), 'hex'))
      db.query('SELECT bssid, essid, identity FROM aps WHERE bssid IN (?)', [rows], cb)
    },
    add (bssid, essid, identity, cb) {
      db.query("INSERT INTO aps (bssid, essid, identity, time) VALUES (UNHEX(REPLACE(?, ':','' )), ?,?, CURRENT_TIMESTAMP)", [bssid, essid, identity], cb)
    },
    addMultiple (aps, identity, cb) {
      const rows = []
      for (const ap of aps) rows.push([Buffer.from(ap.bssid.replace(/:/g, ''), 'hex'), ap.essid, identity, 'CURRENT_TIMESTAMP'])
      db.query('INSERT INTO aps (bssid, essid, identity, time) VALUES ?', [rows], cb)
    }
  },
  inbox: {
    totalMessages (receiver, cb) {
      db.query('SELECT count(id) as count FROM messages WHERE receiver = ? ', [receiver], (err, result) => {
        if (err) {
          cb(err)
          return
        }

        cb(null, result[0].count)
      })
    },
    messages (receiver, limit, offset, cb) {
      db.query('SELECT created_at,updated_at,deleted_at,seen_at,sender,sender_name,data,signature,id FROM messages WHERE receiver = ? LIMIT ? OFFSET ?', [receiver, limit, offset], cb)
    },
    message (messageId, receiver, cb) {
      db.query('SELECT created_at,updated_at,seen_at,deleted_at,sender,sender_name,data,signature,id FROM messages WHERE id = ? AND receiver = ?', [messageId, receiver], (err, result) => {
        if (err) {
          cb(err)
          return
        }

        if (result.length === 0) { cb(null, null) } else { cb(null, result[0]) }
      })
    },
    add (receiver, senderName, senderFingerprint, data, signature, cb) {
      db.query('INSERT INTO messages (receiver,sender_name,sender,data,signature) VALUES (?,?,?,?,?)', [receiver, senderName, senderFingerprint, data, signature], cb)
    },
    markMessageSeen (messageId, receiver, cb) {
      // TODO: what if the message doesn't exists?
      db.query('UPDATE messages SET seen_at = CURRENT_TIMESTAMP WHERE id = ? AND receiver = ?', [messageId, receiver], cb)
    },
    markMessageUnseen (messageId, receiver, cb) {
      // TODO: what if the message doesn't exists?
      db.query('UPDATE messages SET seen_at = NULL WHERE id = ? AND receiver = ?', [messageId, receiver], cb)
    },
    deleteMessage (messageId, receiver, cb) {
      // TODO: what if the message doesn't exists?
      db.query('DELETE FROM  messages WHERE id = ? AND receiver = ?', [messageId, receiver], cb)
    }
  },
  statistics: {
    apsByDay (days, unit = null, cb) {
      if (unit != null) {
        db.query("SELECT DATE_FORMAT(time, '%Y-%m-%d') AS day, COUNT(ID) AS reported FROM aps WHERE identity = ? GROUP BY day ORDER BY day DESC LIMIT ?", [unit, days], cb)
      } else {
        db.query("SELECT DATE_FORMAT(time, '%Y-%m-%d') AS day, COUNT(ID) AS reported FROM aps GROUP BY day ORDER BY day DESC LIMIT ?", [days], cb)
      }
    },
    messagesByDay (days, cb) {
      db.query("SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(ID) AS messages FROM messages GROUP BY day ORDER BY day DESC LIMIT ?", [days], cb)
    },
    leaders (units, cb) {
      db.query('SELECT u.country, u.name, a.identity, COUNT(DISTINCT a.bssid) AS amount FROM units u JOIN aps a ON u.identity = a.identity WHERE u.updated_at >= DATE_SUB(NOW(), INTERVAL 10 DAY) GROUP BY u.country, u.name, a.identity, u.data ORDER BY amount DESC LIMIT ?;', [units], cb)
    },
    unitsByDay (days, cb) {
      db.query("SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(ID) AS units FROM units GROUP BY day ORDER BY day DESC LIMIT ?", [days], cb)
    },
    unitsByCountry (days, cb) {
      db.query('SELECT country, COUNT(*) AS units FROM units WHERE updated_at >= NOW() - INTERVAL 30 DAY GROUP BY country;', [days], cb)
    }
  }
}

module.exports = queries
