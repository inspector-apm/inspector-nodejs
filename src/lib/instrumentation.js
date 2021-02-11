const Hook = require("require-in-the-middle");
const path = require("path");

const _MODULES = {
  mysql2: (agent) => {
    Hook(["mysql2"], function (exports, name, basedir) {
      const version = require(path.join(basedir, "package.json")).version;
      return require("../modules/mysql2.js")(exports, agent, version);
    });
  },
  mssql: (agent) => {
    Hook(["mssql"], function (exports, name, basedir) {
      const version = require(path.join(basedir, "package.json")).version;
      return require("../modules/mssql.js")(exports, agent, version);
    });
  },
  express: (agent) => {
    Hook(["express"], function (exports, name, basedir) {
      agent.expressMiddleware = (opts = {}) => {
        return require("../modules/express.js")(agent, opts);
      };
      return exports;
    });
  },
  fastify: (agent) => {
    agent.fastify = (opts = {}) => {
      return require("../modules/fastify.js")(agent, opts);
    };
  },
  pg: (agent) => {
    Hook(["pg"], function (exports, name, basedir) {
      const version = require(path.join(basedir, "package.json")).version;
      return require("../modules/pg.js")(exports, agent, version);
    });
  },
  mongodb: (agent) => {
    Hook(["mongodb"], function (exports, name, basedir) {
      const version = require(path.join(basedir, "package.json")).version;
      return require("../modules/mongodb.js")(exports, agent, version);
    });
  },
  knex: (agent) => {
    Hook(["knex"], function (exports, name, basedir) {
      const version = require(path.join(basedir, "package.json")).version;
      return require("../modules/knex.js")(exports, agent, version);
    });
  },
};

class Instrumentation {
  init(agent) {
    if (agent._conf.autoWiring) {
      Object.keys(_MODULES).map((module) => {
        this.patch(module, agent);
      });
    } else {
      agent._conf.modules.forEach((module) => this.patch(module, agent));
    }
  }

  patch(name, agent) {
    if (Object.keys(_MODULES).indexOf(name) === -1) {
      throw new Error(`Module ${name} not supported`);
    }
    _MODULES[name](agent);
    return this;
  }
}

module.exports = new Instrumentation();
