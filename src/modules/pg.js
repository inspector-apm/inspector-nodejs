'use strict'

const shimmer = require('shimmer')

module.exports = function (pg, inspector, version = null) {
  patchClient(pg.Client, 'pg.Client', inspector)

  // Trying to access the pg.native getter will trigger and log the warning
  // "Cannot find module 'pg-native'" to STDERR if the module isn't installed.
  // Overwriting the getter we can lazily patch the native client only if the
  // user is acually requesting it.
  var getter = pg.__lookupGetter__('native')
  if (getter) {
    delete pg.native
    // To be as true to the original pg module as possible, we use
    // __defineGetter__ instead of Object.defineProperty.
    pg.__defineGetter__('native', function () {
      var native = getter()
      if (native && native.Client) {
        patchClient(native.Client, 'pg.native.Client', inspector)
      }
      return native
    })
  }

  return pg
}

function patchClient (Client, klass, inspector) {
  shimmer.wrap(Client.prototype, 'query', wrapQuery)

  function wrapQuery (orig, name) {
    return function wrappedFunction (sql) {
      if (inspector.isRecording()) {

        let segment = inspector.startSegment('pgsql query')

        if (sql && typeof sql.text === 'string') sql = sql.text

        if (segment) {
          var args = arguments
          var index = args.length - 1
          var cb = args[index]

          if (Array.isArray(cb)) {
            index = cb.length - 1
            cb = cb[index]
          }

          if (typeof sql === 'string') {
            segment._label = sql
          }

          if (typeof cb === 'function') {
            args[index] = end
            return orig.apply(this, arguments)
          } else {
            cb = null
            var query = orig.apply(this, arguments)

            // The order of these if-statements matter!
            //
            // `query.then` is broken in pg <7 >=6.3.0, and since 6.x supports
            // `query.on`, we'll try that first to ensure we don't fall through
            // and use `query.then` by accident.
            //
            // In 7+, we must use `query.then`, and since `query.on` have been
            // removed in 7.0.0, then it should work out.
            //
            // See this comment for details:
            // https://github.com/brianc/node-postgres/commit/b5b49eb895727e01290e90d08292c0d61ab86322#commitcomment-23267714
            if (typeof query.on === 'function') {
              query.on('end', end)
              query.on('error', end)
            } else if (typeof query.then === 'function') {
              query.then(end)
            } else {
              console.log('ERROR: unknown pg query type: %s %o', typeof query)
            }
            return query
          }
        } else {
          return orig.apply(this, arguments)
        }

        function end () {
          segment.end()
          if (cb) return cb.apply(this, arguments)
        }
      }
    }
  }
}
