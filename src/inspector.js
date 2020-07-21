const Transaction = require('./lib/transaction.js')
const Segment = require('./lib/segment.js')
const Transport = require('./lib/transport')
const IError = require('./lib/error')

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

    process.on('uncaughtException', async (err, origin) => {
      await this.reportException(err)
    })

    process.on('unhandledRejection', async (err, origin) => {
      await this.reportException(err)
    })

    process.on('beforeExit', (code) => {
      if(this.isRecording()) {
        this.flush()
      }
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
      await this.reportException(e)
      if (throwE) {
        throw e
      }
    } finally {
      segment.end()
    }
  }

  async reportException (error) {
    if (this.isRecording()) {
      const segment = this.startSegment('exception', error.message)
      const e = new IError(error, this._transaction)
      await e.populateError()
      this.addEntries(e)
      segment.end()
    }
  }

  addEntries (data) {
    if (Array.isArray(data)) {
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
