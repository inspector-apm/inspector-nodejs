'use strict'
const os = require('os')
const stacktrace = require('./stacktrace')

class IError {

  constructor (error = {}, { hash, name }) {
    this._model = 'error'
    this._timestamp = new Date().getTime()
    this._transaction = { hash, name }
    this._handled = false
    this._errorStack = error.stack || error.stacktrace || ''
    this._host = {
      hostname: os.hostname()
    }
  }

  async populateError () {
    const { className, errorMessage, file, line, stack } = await this.errorElementFromStackTrace(this._errorStack)
    this._message = errorMessage
    this._class = className
    this._file = file
    this._line = line
    this._stack = stack
  }

  setHandled (value) {
    this._handled = value
  }

  toTransport () {
    const obj = {
      'model': this._model,
      'timestamp': parseInt((this._timestamp / 1000).toFixed(0)),
      'message': this._message,
      'class': this._class,
      'file': this._file,
      'line': this._line,
      'handled': this._handled,
      'transaction': this._transaction,
      'host': this._host,
      'stack': this._stack
    }

    /*if (Array.isArray(this._stack) && this._stack.length > 0) {
      this._stack.map(item => {
        const tObj = {
          'type': item.type ? item.type : '',
          'class': item.class ? item.class : '',
          'args': item.args ? item.args : [],
          'function': item.fn ? item.fn : '',
          'file': item.file,
          'line': item.line,
          'code': item.code
        }
        obj.stack.push(tObj)
      })
    }*/

    return obj
  }

  async errorElementFromStackTrace (rawStack) {
    rawStack = rawStack.split('\n')

    let firstLine = rawStack.shift().split(':')

    let errorObj = {
      className: firstLine[0],
      errorMessage: firstLine[1].trim(),
      stack: []
    }

    for (const [index, line] of rawStack.entries()) {
      let lineObj = stacktrace.stackLineParser(line)
      lineObj.code = await stacktrace.getCodeOfStackElement(lineObj)

      // Populate the top level object
      if (index === 0) {
        errorObj.file = lineObj.file
        errorObj.line = lineObj.line
      }
      errorObj.stack.push(lineObj)
    }

    return errorObj

    /*const aStack = stacktrace.split('\n')
    const classLine = aStack[0]
    const className = classLine.split(':')[0]
    const errMex = classLine.split(':')[1].trim()

    let firstRow = this.formatStackElementToObj(aStack[1])
    const file = firstRow.file
    const line = firstRow.line
    const code = await this.getCodeOfStackElement(firstRow)

    const stack = []
    for (let i = 1; i < aStack.length; i++) {
      const stackRow = this.formatStackElementToObj(aStack[i])
      if (stackRow.file.indexOf('internal/') === -1) {
        stackRow.code = await this.getCodeOfStackElement(stackRow)
        stack.push(stackRow)
      }
    }
    return {
      className,
      errMex,
      file,
      line,
      code,
      stack,
    }*/
  }

  /*async getCodeOfStackElement (stackObj, limit = 10) {
    const code = []
    let i = 0
    let minLine = (parseInt(stackObj.line) - limit) > 1 ? (stackObj.line - limit) : 1
    let maxLine = parseInt(stackObj.line) + limit

    const rl = readline.createInterface({
      input: fs.createReadStream(stackObj.file),
      crlfDelay: Infinity
    })

    for await (const line of rl) {
      i++
      if (i >= minLine && i <= maxLine) {
        const obj = {
          code: line,
          line: i
        }
        code.push(obj)
      }
    }
    return code
  }*/

  /**
   *
   * @param stackRow
   * @returns {{file: string, ch: string, line: string, fn: null}}
   */
  /*formatStackElementToObj (stackRow) {
    const row = stackRow.replace('    at ', '')
    let fn = null
    let file = null
    let line = null
    let ch = null
    if (row.indexOf('(') !== -1) {
      const rowSplit = row.split('(')
      fn = rowSplit[0].trim()
      const fileComplete = rowSplit[1].replace(')', '')
      const fileSplit = fileComplete.split(':')
      file = fileSplit[0].trim()
      line = fileSplit[1].trim()
      ch = fileSplit[2].trim()
    } else {
      const fileSplit = row.split(':')
      file = fileSplit[0].trim()
      line = fileSplit[1].trim()
      ch = fileSplit[2].trim()
    }
    return {
      fn,
      file,
      line,
      ch
    }
  }*/

}

module.exports = IError
