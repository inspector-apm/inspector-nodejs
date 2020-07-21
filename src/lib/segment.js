'use strict'

class Segment {

  constructor ({ hash, timestamp }, type = 'process', label = null) {
    this._model = 'Segment'
    this._label = label
    this._type = type
    this._transaction = {
      hash,
      timestamp
    }
  }

  start (time = null) {
    const initialTime = time ? new Date(time).getTime() : new Date().getTime()
    this._start = initialTime - this._transaction.timestamp
    this._timestamp = initialTime
    return this
  }

  end (duration = null) {
    duration = duration ? new Date(duration).getTime() : null
    this._duration = duration ? duration : new Date().getTime() - this._timestamp
    return this
  }

  toTransport () {
    return {
      "model": "segment",
      "type": this._type,
      "label": this._label,
      "timestamp": parseInt((this._timestamp / 1000).toFixed(0)),
      "start": parseInt((this._start / 1000).toFixed(0)),
      "duration": this._duration,
      "transaction": {
        "hash": this._transaction.hash
      }
    }
  }

  get label () {
    return this._label
  }

  get timestamp () {
    return this._timestamp
  }

  get transaction () {
    return this._transaction
  }

  get duration () {
    return this._duration
  }

  get startTime () {
    return this._start
  }

}

module.exports = Segment
