"use strict";
const fp = require("fastify-plugin");
module.exports = function (inspector, opts = {}) {
  return fp(
    function (fastify, intOpts, next) {
      if (!fastify.inspector) {
        fastify.decorate("inspector", inspector);
      }

      fastify.addHook("onRequest", (request, reply, done) => {
        const method = request.routerMethod || request.raw.method; // Fallback for fastify >3 <3.3.0
        const url = request.routerPath || reply.context.config.url; // Fallback for fastify >3 <3.3.0
        const name = method + " " + url;

        if (
          !Array.isArray(opts.excludePaths) ||
          opts.excludePaths.indexOf(url) === -1
        ) {
          const transaction = fastify.inspector.startTransaction(`${name}`);
          transaction.addContext("Request", {
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

          transaction.addContext("body", request.body);

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
