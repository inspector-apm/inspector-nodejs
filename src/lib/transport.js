'use strict'

const https = require('https')

class Transport {
  constructor (conf) {
    this._conf = {
      ...conf
    }

    this.queue = []
  }

  setConf (conf) {
    this._conf = {
      ...this._conf,
      ...conf
    }

    this.queue = []
  }

  flush () {
    if (Array.isArray(this.queue) && this.queue.length === 0) {
      return
    }
    const items = []
    this.queue.forEach(item => {
      items.push(item.toTransport())
    })
    this.send(items)
    this.queue = []
  }

  addEntry (item) {
    this.queue.push(item)
  }

  send (items = []) {
    const options = {
      host: this._conf.url,
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Inspector-Key': this._conf.ingestionKey,
        'X-Inspector-Version': this._conf.version,
      }
    }

    const req = https.request(options, (res) => {
      res.on('end', function () {
        // print to console when response ends
      })
    })

    req.on('error', (e) => {
      console.error('errore', e)
    })

    req.write(JSON.stringify(items))
    req.end()
  }

}

module.exports = Transport
