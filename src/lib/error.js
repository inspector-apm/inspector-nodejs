"use strict";
const readline = require("readline");
const fs = require("fs");

class IError {
  constructor(error = {}, { hash, name }) {
    this.error = error;
    this._model = "error";
    this._timestamp = new Date().getTime();
    this._transaction = {
      hash,
      name,
    };
    this._handled = false;
    if (error.code) {
      this._code = error.code;
    }
    if (error.message) {
      this.message = error.message;
    }
    this._errorStack = error.stack;
  }

  async populateError() {
    try {
      const {
        className,
        errMex,
        file,
        line,
        stack,
      } = await this.errorElementFromStackTrace(this.error);
      this._message = errMex;
      this._class = className;
      this._file = file;
      this._line = line;
      this._stack = stack;
    } catch (e) {
      this._message = this.message;
      this._class = "";
      this._file = "";
      this._line = "";
      this._stack = [];
    }
  }

  setHandled(value) {
    this._handled = value;
  }

  toTransport() {
    const obj = {
      model: this._model,
      timestamp: parseInt((this._timestamp / 1000).toFixed(0)),
      message: this._message,
      class: this._class,
      file: this._file,
      line: this._line,
      handled: this._handled,
      stack: [],
      transaction: this._transaction,
    };

    if (this._code) {
      obj.code = this._code;
    }

    if (Array.isArray(this._stack) && this._stack.length > 0) {
      this._stack.map((item) => {
        const tObj = {
          type: item.type ? item.type : "",
          class: item.class ? item.class : "",
          args: item.args ? item.args : [],
          function: item.fn ? item.fn : "",
          file: item.file,
          line: item.line,
          code: item.code,
        };
        obj.stack.push(tObj);
      });
    }

    return obj;
  }

  async errorElementFromStackTrace(error) {
    const aStack = error.stack;
    let props = {};
    if (aStack.length > 2) {
      const site = aStack[0];
      props = {
        file: site.getFileName(),
        line: parseInt(site.getLineNumber()),
        columnNumber: parseInt(site.getColumnNumber()),
        methodName: site.getMethodName(),
        className: site.getFunctionName() || site.getFileName(),
        errMex: error.message,
      };
    }

    const stack = [];
    for (let i = 0; i < aStack.length; i++) {
      const site = aStack[i];
      const stackRow = {
        file: site.getFileName(),
        line: parseInt(site.getLineNumber()),
      };
      // const stackRow = this.formatStackElementToObj(aStack[i]);
      if (stackRow.file && stackRow.file.indexOf("internal/") === -1) {
        stackRow.code = await this.getCodeOfStackElement(stackRow);
        stack.push(stackRow);
      }
    }
    return {
      ...props,
      stack,
    };
  }

  async getCodeOfStackElement(stackObj, limit = 10) {
    const code = [];
    let i = 0;
    let minLine =
      parseInt(stackObj.line) - limit > 1 ? stackObj.line - limit : 1;
    let maxLine = parseInt(stackObj.line) + limit;

    const rl = readline.createInterface({
      input: fs.createReadStream(stackObj.file),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      i++;
      if (i >= minLine && i <= maxLine) {
        const obj = {
          code: line,
          line: i,
        };
        code.push(obj);
      }
    }
    return code;
  }

  formatStackElementToObj(stackRow) {
    const row = stackRow.replace("    at ", "");
    let fn = null;
    let file = "";
    let line = null;
    let ch = null;
    if (row.indexOf("(") !== -1) {
      const rowSplit = row.split("(");
      fn = rowSplit[0].trim();
      const fileComplete = rowSplit[1].replace(")", "");
      const fileSplit = fileComplete.split(":");
      if (fileSplit.length >= 3) {
        for (let i = 0; i < fileSplit.length - 2; i++) {
          file += fileSplit[i];
        }
        line = fileSplit[fileSplit.length - 2].trim();
        ch = fileSplit[fileSplit.length - 1].trim();
      } else {
        file = null;
      }
    } else {
      const fileSplit = row.split(":");
      if (fileSplit.length >= 3) {
        for (let i = 0; i < fileSplit.length - 2; i++) {
          file += fileSplit[i];
        }
        line = fileSplit[fileSplit.length - 2].trim();
        ch = fileSplit[fileSplit.length - 1].trim();
      } else {
        file = null;
      }
    }
    return {
      fn,
      file,
      line,
      ch,
    };
  }
}

module.exports = IError;
