"use strict";

const fp = require("fastify-plugin");
const utils = require('./utils');

module.exports = function (inspector, opts = {}) {
  return fp(
    function (fastify, intOpts, next) {
      if (!fastify.inspector) {
        fastify.decorate("inspector", inspector);
      }

      fastify.addHook("onRequest", (request, reply, done) => {
        const method = request.routerMethod || request.raw.method; // Fallback for fastify >3 <3.3.0
        const url = request.routerPath || reply.context.config.url; // Fallback for fastify >3 <3.3.0

        let shouldBeMonitored = true;

        if (Array.isArray(opts.excludePaths)) {
          for (let rule in opts.excludePaths) {
            if (utils.matchRule(url, opts.excludePaths[rule])) {
              shouldBeMonitored = false;
              break;
            }
          }
        }

        if (shouldBeMonitored) {
          const transaction = fastify.inspector.startTransaction(method + " " + url);

          transaction.addContext("Url", {
            params: request.params,
            query: request.query,
            url: request.url,
          });
        }

        done();
      });

      fastify.addHook("onResponse", (request, reply, done) => {
        const transaction = fastify.inspector.currentTransaction();
        if (transaction) {
          transaction.setResult("" + reply.statusCode);

          transaction.addContext("Body", request.body);

          transaction.addContext("Response", {
            status_code: reply.statusCode,
            headers: reply.getHeaders(),
          });

          transaction.end();
          inspector.flush();
        }
        done();
      });

      next();
    },
    { name: "inspector-fastify" }
  );
};
