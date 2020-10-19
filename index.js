'use strict'
const Inspector = require('./src/inspector')

module.exports = (conf = {}) => {
  return new Inspector(conf)
}
