const tap = require('tap')
const { Inspector } = require('../../index')

async function transport_test (throwError = false) {
  const inspector = new Inspector({
    apiKey: '61b8b0f75a4b4dc7682eedcce097b64b'
  })
  tap.equal(inspector.conf.url === 'ingest.inspector.dev', true)

  const transaction = inspector.startTransaction('foo')
  tap.equal(inspector.currentTransaction().hash === transaction.hash, true)

  const segment = await inspector.addSegment(
    async (segment) => {
      await wait(3000)
      const arr = Array(1e6).fill('some string')
      arr.reverse()
      return segment
    },
    'test async',
    'test label',
  )

  transaction.end()
  inspector.flush()

  tap.equal(inspector.isRecording(), false)
  tap.equal(inspector.currentTransaction(), null)
}

function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

transport_test()

