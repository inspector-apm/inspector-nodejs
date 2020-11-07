const Transaction = require('./lib/transaction.js')
const Segment = require('./lib/segment.js')
const Transport = require('./lib/transport')
const Instrumentation = require('./lib/instrumentation')
const IError = require('./lib/error')

class Inspector {

  constructor (conf = {}) {
    this._conf = {
      url: 'ingest.inspector.dev',
      ingestionKey: '',
      enabled: true,
      autoWiring: true,
      modules: [],
      maxEntries: 100,
      ...conf
    }
    this._transaction = null
    this.transport = new Transport(this._conf)

    // patch modules with instrumentations
    Instrumentation.init(this)

    process.on('uncaughtException', async (err, origin) => {
      if (this.isRecording()) {
        await this.reportException(err)
      } else {
        console.log(err)
      }
    })

    process.on('unhandledRejection', async (err, origin) => {
      if (this.isRecording()) {
        await this.reportException(err)
      } else {
        console.log(err)
      }
    })

    process.on('beforeExit', (code) => {
      if (this.isRecording()) {
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
      if (fn[Symbol.toStringTag] === 'AsyncFunction') {
        return await fn(segment)
      } else {
        return fn(segment)
      }
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
    const segment = this.startSegment('exception', error.message)
    const e = new IError(error, this._transaction)
    await e.populateError()
    this.addEntries(e)
    segment.end()
  }

  addEntries (data) {
    if (Array.isArray(this.transport.queue) && this.transport.queue.length < this._conf.maxEntries) {
      if (Array.isArray(data)) {
        data.forEach(item => {
          this.transport.addEntry(item)
        })
      } else {
        this.transport.addEntry(data)
      }
    }
    return this
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
