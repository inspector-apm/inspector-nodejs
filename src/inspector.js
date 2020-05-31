const Transaction = require('./lib/transaction.js')
const Segment = require('./lib/segment.js')

class Inspector {

  constructor (conf) {
    this._conf = {
      url: 'https://ingest.inspector.dev',
      apiKey: '',
      enabled: true,
      transport: null,
      version: '1.0.0',
      options: [],
      ...conf
    }
    this._transaction = null
    //@todo transport class

    process.on('exit', (code) => {
      this.flush()
    })
  }

  startTransaction (name) {
    this._transaction = new Transaction(name)
    this._transaction.start()

    //@todo add transaction to transport

    return this._transaction
  }

  currentTransaction () {
    return this._transaction
  }

  hasTransaction () {
    return !!this._transaction
  }

  isRecording () {
    // todo ridondante?
    return this.hasTransaction()
  }

  startSegment (type, label = null) {
    const segment = new Segment(this._transaction, type, label)
    segment.start()

    //@todo add segment to transport

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

  addEntries () {
    // todo implement
  }

  flush () {
    if (!this._conf.enabled || !this.isRecording()) {
      return
    }

    if (!this._transaction.isEnded()) {
      this._transaction.end()
    }

    //@todo add transport flush

    this._transaction = null
  }

  get conf () {
    return this._conf
  }

}

module.exports = Inspector
