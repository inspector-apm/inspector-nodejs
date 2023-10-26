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

    return obj;
  }

  async errorElementFromStackTrace (rawStack) {
    rawStack = rawStack.split('\n');

    let firstLine = rawStack.shift().split(':');

    let errorObj = {
      className: firstLine[0],
      errorMessage: firstLine[1].trim(),
      stack: []
    };

    for (const [index, line] of rawStack.entries()) {
      let lineObj = stacktrace.stackLineParser(line);
      lineObj.code = await stacktrace.getCodeOfStackElement(lineObj);

      // Populate the top level object
      if (index === 0) {
        errorObj.file = lineObj.file;
        errorObj.line = lineObj.line;
      }
      errorObj.stack.push(lineObj);
    }

    return errorObj;
  }
}

module.exports = IError
