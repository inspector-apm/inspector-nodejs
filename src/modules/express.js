'use strict'

const utils = require('./utils');

module.exports = function (inspector, opts = {}) {

  return (req, res, next) => {
    let shouldBeMonitored = true;

    if (Array.isArray(opts.excludePaths)) {
      for (let rule in opts.excludePaths) {
        if (utils.matchRule(req.originalUrl, opts.excludePaths[rule])) {
          shouldBeMonitored = false;
          break;
        }
      }
    }

    if(shouldBeMonitored) {
      const transaction = inspector.startTransaction('');

      req.inspector = inspector;

      res.on('finish', () => {
        transaction._name = `${req.method} ${req.route ? req.route.path : req.originalUrl}`
        transaction.setResult('' + res.statusCode);

        if (req.body) {
          transaction.addContext('Body', req.body);
        }

        transaction.addContext('Url', {
          protocol: req.protocol,
          params: req.params,
          query: req.query,
          url: req.originalUrl,
          full: req.protocol + '://' + req.get('host') + req.originalUrl
        });

        transaction.addContext('Request', {
          method: req.method,
          headers: req.headers,
        });

        transaction.addContext('Response', {
          status_code: res.statusCode,
          http_version: res._header.substr(5, 3).trim(),
          headers: res.getHeaders(),
          ...(req.cookies ? {cookie: req.cookies} : {})
        });

        transaction.end();
        inspector.flush();
      });
    }

    return next();
  }
}
