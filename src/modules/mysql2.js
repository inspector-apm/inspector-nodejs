'use strict'

const shimmer = require('shimmer')

module.exports = function (mysql2, inspector, version) {

  shimmer.wrap(mysql2.Connection.prototype, 'query', wrapQuery)
  shimmer.wrap(mysql2.Connection.prototype, 'execute', wrapQuery)

  return mysql2

  function wrapQuery (original) {
    return function wrappedQuery (sql, values, cb) {
      if (inspector.isRecording()) {
        let sqlStr = null
        let hasCallback = false

        let segment = inspector.startSegment('mysql query')

        switch (typeof sql) {
          case 'string':
            sqlStr = sql
            break
          case 'object':
            if (typeof sql.onResult === 'function') {
              sql.onResult = wrapCallback(sql.onResult)
            }
            sqlStr = sql.sql
            break
          case 'function':
            arguments[0] = wrapCallback(sql)
            break
        }

        if(sqlStr) {
          segment._label = sqlStr
        }

        if (typeof values === 'function') {
          arguments[1] = wrapCallback(values)
        } else if (typeof cb === 'function') {
          arguments[2] = wrapCallback(cb)
        }

        const result = original.apply(this, arguments)
        if (result && !hasCallback) {
          if (segment) {
            shimmer.wrap(result, 'emit', function (original) {
              return function (event) {
                switch (event) {
                  case 'error':
                  case 'close':
                  case 'end':
                    segment.end()
                }
                return original.apply(this, arguments)
              }
            })
          }
        }

        return result

        function wrapCallback (cb) {
          hasCallback = true
          return segment ? wrappedCallback : cb
          function wrappedCallback () {
            segment.end()
            return cb.apply(this, arguments)
          }
        }
      }
    }
  }
}
