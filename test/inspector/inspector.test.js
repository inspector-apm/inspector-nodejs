const tap = require('tap')
const { Inspector } = require('../../index')

async function inspector_test (throwError = false) {
  const inspector = new Inspector({})
  tap.equal(inspector.conf.url === 'ingest.inspector.dev', true)

  const transaction = inspector.startTransaction('foo')
  tap.equal(inspector.currentTransaction().hash === transaction.hash, true)

  const segment = await inspector.addSegment(
    async (segment) => {
      await wait(500)
      const arr = Array(1e6).fill('some string')
      arr.reverse()
      return segment
    },
    'test async',
    'test label',
  )

  let errorThrowed = false
  let segmentEx = null
  try {
    segmentEx = await inspector.addSegment(
      async (segment) => {
        throw new Error('generic error')
      },
      'test async',
      'test label',
      throwError
    )
  } catch (e) {
    errorThrowed = true
  }

  transaction.end()
  if (throwError) {
    tap.equal(errorThrowed, true)
  } else {
    tap.equal(errorThrowed, false)
  }

  inspector.flush()

  tap.equal(inspector.isRecording(), false)
  tap.equal(inspector.currentTransaction(), null)
}

function inspector_test_transactionNotEnd () {
  const inspector = new Inspector({})
  const transaction = inspector.startTransaction('foo')

  tap.equal(inspector.currentTransaction().hash === transaction.hash, true)

}

function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

inspector_test()
inspector_test(true)
inspector_test_transactionNotEnd()

