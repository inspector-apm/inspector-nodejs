'use strict'

class Transaction {

  constructor (name) {
    this._model = 'Transaction'
    this._type = 'request'
    this._name = name
    this._hash = `${Date.now()}${Math.floor(Math.random() * 100)}`
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
