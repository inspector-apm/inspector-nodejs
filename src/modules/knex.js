'use strict'

var shimmer = require('shimmer')

module.exports = function (Knex, inspector, version) {

  if (Knex.Client && Knex.Client.prototype) {
    var QUERY_FNS = ['queryBuilder', 'raw']
    shimmer.wrap(Knex.Client.prototype, 'runner', wrapRunner)
    shimmer.massWrap(Knex.Client.prototype, QUERY_FNS, wrapQueryStartPoint)
  }

  function wrapQueryStartPoint (original) {
    return function wrappedQueryStartPoint () {
      var builder = original.apply(this, arguments)

      var obj = {}
      Error.captureStackTrace(obj)
      builder['InspectorStack'] = obj

      return builder
    }
  }

  function wrapRunner (original) {
    return function wrappedRunner () {
      var runner = original.apply(this, arguments)

      shimmer.wrap(runner, 'query', wrapQuery)
      return runner
    }
  }

  function wrapQuery (original) {
    return function wrappedQuery () {
      if (this.connection) {
        this.connection['InspectorStack'] = this.builder ? this.builder['InspectorStack'] : null
      }
      return original.apply(this, arguments)
    }
  }

  return Knex
}
