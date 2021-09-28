"use strict";

const shimmer = require("shimmer");

module.exports = function (mssql, inspector, version) {
  shimmer.wrap(mssql.ConnectionPool.prototype, "query", wrapQuery);

  return mssql;

  function wrapQuery(original) {
    return function wrappedQuery(sql, cb) {
      if (inspector.isRecording()) {
        let sqlStr = null;
        let hasCallback = false;
        let segment = inspector.startSegment("mssql");

        switch (typeof sql) {
          case "string":
            sqlStr = sql;
            break;
        }

        if (sqlStr) {
          segment._label = sqlStr;
        }

        if (typeof cb === "function") {
          arguments[1] = wrapCallback(cb);
        }

        const result = original.apply(this, arguments);
        if (result && !hasCallback) {
          Promise.all([result]).then(() => {
            if (segment) {
              segment.end();
            }
          });
        }

        //eslint-disable-next-line
        function wrapCallback(cb) {
          hasCallback = true;
          return segment ? wrappedCallback : cb;
          function wrappedCallback() {
            segment.end();
            return cb.apply(this, arguments);
          }
        }

        return result;
      }
      return original.apply(this, arguments);
    };
  }
};
