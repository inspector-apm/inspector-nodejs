const Transaction = require('./lib/transaction.js')
const Segment = require('./lib/segment.js')
const Transport = require('./lib/transport')

class Inspector {

  constructor (conf) {
    this._conf = {
      url: 'ingest.inspector.dev',
      apiKey: '',
      enabled: true,
      version: '1.0.0',
      options: [],
      ...conf
    }
    this._transaction = null
    this.transport = new Transport(this._conf)

    process.on('exit', (code) => {
      this.flush()
    })
  }

  startTransaction (name) {
    this._transaction = new Transaction(name)
    this._transaction.start()

    this.addEntries(this._transaction)

    return this._transaction
  }

  currentTransaction () {
    return this._transaction
  }

  isRecording () {
    return !!this._transaction
  }

  startSegment (type, label = null) {
    const segment = new Segment(this._transaction, type, label)
    segment.start()

    this.addEntries(segment)

    return segment
  }

  async addSegment (fn, type, label = null, throwE = false) {
    const segment = this.startSegment(type, label)
    try {
      return await fn(segment)
    } catch (e) {
      if (throwE) {
        throw e
      }
      this.reportException(e)
    } finally {
      segment.end()
    }
  }

  reportException () {
    // todo implement
  }

  addEntries (data) {
    if(Array.isArray(data)) {
        data.forEach(item => {
          this.transport.addEntry(item)
        })
    } else {
      this.transport.addEntry(data)
    }
  }

  flush () {
    if (!this._conf.enabled || !this.isRecording()) {
      return
    }

    if (!this._transaction.isEnded()) {
      this._transaction.end()
    }

    this.transport.flush()
    this._transaction = null
  }

  get conf () {
    return this._conf
  }

}

module.exports = Inspector
