// test/hello-world.js
const tap = require('tap')
const { Transaction } = require('../../index')

async function transaction_test (start = null, duration = null) {
  const transaction = new Transaction('test')
  await wait(20)
  const transaction2 = new Transaction('test2')

  tap.equal(transaction.hash !== transaction2.hash, true)
  tap.equal(transaction.name, 'test')

  tap.equal(transaction.isEnded(), false)

  transaction.start(start)
  await wait(500)
  transaction.end(duration)

  tap.equal(transaction.isEnded(), true)
  tap.type(transaction.duration, 'number')
  tap.type(transaction.memory_peak, 'number')
  tap.type(transaction.timestamp, 'number')

  /* console.log('timestamp', transaction.timestamp)
  console.log('duration', transaction.duration)
  console.log('memory used', transaction.memory_peak)*/

}

function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

transaction_test()
transaction_test(30, 6)


