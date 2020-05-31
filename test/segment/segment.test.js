// test/hello-world.js
const tap = require('tap')
const { Segment } = require('../../index')

async function segment_test (start = null, duration = null) {
  const transactionTimestamp = new Date().getTime()

  const segment = new Segment(
    {
      hash: 'test',
      timestamp: transactionTimestamp
    },
    'process',
    'foo'
  )

  tap.equal(segment.label, 'foo')
  tap.equal(segment.transaction.timestamp, transactionTimestamp)
  tap.equal(segment.transaction.hash, 'test')

  segment.start(start)
  await wait(500)
  segment.end(duration)

  tap.equal(segment.startTime, segment.timestamp - segment.transaction.timestamp)
  tap.type(segment.duration, 'number')
  tap.type(segment.timestamp, 'number')
  tap.type(segment.startTime, 'number')
  /* console.log('segment timestamp', segment.timestamp)
  console.log('segment startTime', segment.startTime)
  console.log('segment duration', segment.duration) */
}

function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

segment_test()
segment_test(30, 6)
