'use strict'
const readline = require('readline')
const fs = require('fs')
const os = require('os')

class IError {

  constructor (error = {}, { hash, name }) {
    this._model = 'error'
    this._timestamp = new Date().getTime()
    this._transaction = { hash, name }
    this._handled = false
    if (error.code) {
      this._code = error.code
    }
    this._errorStack = error.stack
    this._host = {
      hostname: os.hostname()
    }
  }

  async populateError () {
    const { className, errMex, file, line, code, stack } = await this.errorElementFromStackTrace(this._errorStack)
    this._message = errMex
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
      'stack': [],
      'transaction': this._transaction,
      'host': this._host
    }

    if (this._code) {
      obj.code = this._code
    }

    if (Array.isArray(this._stack) && this._stack.length > 0) {
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
    }

    return obj
  }

  async errorElementFromStackTrace (stacktrace) {
    const aStack = stacktrace.split('\n')
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
    }
  }

  async getCodeOfStackElement (stackObj, limit = 10) {
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
  }

  formatStackElementToObj (stackRow) {
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
  }

}

module.exports = IError
