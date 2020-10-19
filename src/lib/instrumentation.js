const Hook = require('require-in-the-middle')
const path = require('path')

class Instrumentation {
  _MODULES = {
    'mysql2': (agent) => {
      Hook(['mysql2'], function (exports, name, basedir) {
        const version = require(path.join(basedir, 'package.json')).version
        return require('../modules/mysql2.js')(exports, agent, version)
      })
    },
    'express': (agent) => {
      agent.expressMiddleware = (opts = {}) => {
        return require('../modules/express.js')(agent, opts)
      }
    },
  }

  init (agent) {
    agent._conf.modules.forEach(module => this.patch(module, agent))
  }

  patch (name, agent) {
    if (Object.keys(this._MODULES).indexOf(name) === -1) {
      throw new Error(`Module ${name} not supported`)
    }
    this._MODULES[name](agent)
    return this
  }
}

module.exports = new Instrumentation()
