const tap = require('tap')
const { Inspector } = require('../../index')

async function transport_test (throwError = false) {
  const inspector = new Inspector({
    apiKey: '61b8b0f75a4b4dc7682eedcce097b64b'
  })

  const transaction = inspector.startTransaction('foo')

  const error = test.foo

  transaction.end()
  inspector.flush()

}

function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

transport_test()

