'use strict'

const os = require('os')

class Transaction {

  constructor (name) {
    this._model = 'Transaction'
    this._type = 'request'
    this._name = name
    this._hash = `${Date.now()}${Math.floor(Math.random() * 100)}`
    this._http = {}
    this._user = {}
    this._context = {}
    this._result = ''
    this._host = {
      hostname: os.hostname(),
      /*ip: os.address,
      cpu_usage: "float",
      "memory_usage": "float",
      "disk_usage": "float"*/
    }
  }

  withUser (user = {}) {
    this._user = {
      id: user.id,
      name: user.name,
      email: user.email
    }
  }

  setResult (result) {
    this._result = result
    return this
  }

  addContext (label, data) {
    this._context[label] = data
    return this
  }

  start (time = null) {
    this._timestamp = time ? new Date(time).getTime() : new Date().getTime()
    return this
  }

  end (duration = null) {
    duration = duration ? new Date(duration).getTime() : null
    this._duration = duration ? duration : new Date().getTime() - this._timestamp
    this._memory_peak = this.getMemoryPeak()
    return this
  }

  getMemoryPeak () {
    return parseFloat((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2))
  }

  toTransport () {
    return {
      'model': 'transaction',
      'hash': this._hash,
      'name': this._name,
      'type': this._type,
      'timestamp': parseInt((this._timestamp / 1000).toFixed(0)),
      'end': parseInt(((this._timestamp + this._duration) / 1000).toFixed(0)),
      'duration': this._duration,
      'result': this._result,
      'memory_peak': this._memory_peak,
      'user': this._user,
      'http': this._http,
      'host': this._host,
      'context': this._context
    }
  }

  isEnded () {
    return !!(this._duration && this._duration > 0)
  }

  get name () {
    return this._name
  }

  get timestamp () {
    return this._timestamp
  }

  get duration () {
    return this._duration
  }

  get hash () {
    return this._hash
  }

  get memory_peak () {
    return this._memory_peak
  }
}

module.exports = Transaction
