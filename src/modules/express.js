'use strict'

const utils = require('./utils');

module.exports = function (inspector, opts = {}) {

  return (req, res, next) => {

    if (Array.isArray(opts.excludePaths)) {
      for (let rule in opts.excludePaths) {
        if (utils.matchRule(req.path, rule)) {
          return next();
        }
      }
    }

    const transaction = inspector.startTransaction('');

    req.inspector = inspector;

    res.on('finish', () => {
      transaction._name = `${req.method} ${req.route ? req.route.path : req.originalUrl}`
      transaction.setResult('' + res.statusCode);

      if (req.body) {
        transaction.addContext('body', req.body);
      }

      transaction.addContext('Response', {
        status_code: res.statusCode,
        http_version: res._header.substr(5, 3).trim(),
        headers: res.getHeaders(),
      });

      transaction.addContext('Request', {
        params: req.params,
        query: req.query,
        url: req.originalUrl
      });

      transaction.end();
      inspector.flush();
    });

    return next();
  }
}
