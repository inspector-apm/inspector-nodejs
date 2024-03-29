const readline = require('readline')
const fs = require('fs')

const FILENAME_MATCH = /^\s*[-]{4,}$/;
const FULL_MATCH = /at (?:async )?(?:(.+?)\s+\()?(?:(.+):(\d+):(\d+)?|([^)]+))\)?/;

exports.stackLineParser = function(line) {
    const lineMatch = line.match(FULL_MATCH);

    if (lineMatch) {
        let object, method, functionName, typeName, methodName;

        if (lineMatch[1]) {
            functionName = lineMatch[1];

            let methodStart = functionName.lastIndexOf('.');
            if (functionName[methodStart - 1] === '.') {
                methodStart--;
            }

            if (methodStart > 0) {
                object = functionName.slice(0, methodStart);
                method = functionName.slice(methodStart + 1);
                const objectEnd = object.indexOf('.Module');
                if (objectEnd > 0) {
                    functionName = functionName.slice(objectEnd + 1);
                    object = object.slice(0, objectEnd);
                }
            }
            typeName = undefined;
        }

        if (method) {
            typeName = object;
            methodName = method;
        }

        if (method === '<anonymous>') {
            methodName = undefined;
            functionName = undefined;
        }

        if (functionName === undefined) {
            methodName = methodName || '<anonymous>';
            functionName = typeName ? `${typeName}.${methodName}` : methodName;
        }

        let filename = lineMatch[2] && lineMatch[2].startsWith('file://') ? lineMatch[2].slice(7) : lineMatch[2];
        const isNative = lineMatch[5] === 'native';

        if (!filename && lineMatch[5] && !isNative) {
            filename = lineMatch[5];
        }

        const isInternal =
            isNative ||
            (filename &&
                // It's not internal if it's an absolute linux path
                !filename.startsWith('/') &&
                // It's not internal if it's an absolute windows path
                !filename.includes(':\\') &&
                // It's not internal if the path is starting with a dot
                !filename.startsWith('.') &&
                // It's not internal if the frame has a protocol. In node, this is usually the case if the file got pre-processed with a bundler like webpack
                !filename.match(/^[a-zA-Z]([a-zA-Z0-9.\-+])*:\/\//)); // Schema from: https://stackoverflow.com/a/3641782

        // in_app is all that's not an internal Node function or a module within node_modules
        // note that isNative appears to return true even for node core libraries
        // see https://github.com/getsentry/raven-node/issues/176

        const in_app = !isInternal && filename !== undefined && !filename.includes('node_modules/');

        return {
            file: filename,
            //module: getModule ? getModule(filename) : undefined,
            function: functionName,
            line: parseInt(lineMatch[3], 10) || undefined,
            //col: parseInt(lineMatch[4], 10) || undefined,
            in_app,
        };
    }

    if (line.match(FILENAME_MATCH)) {
        return {
            filename: line,
        };
    }

    return undefined;
}


/**
 *
 * @param lineObj = {filename: string, function: string, line: number, in_app: boolean}
 * @param limit
 * @returns {*[]}
 */
exports.getCodeOfStackElement = async function (lineObj, limit = 10) {
    if (!lineObj?.in_app) {
        return;
    }

    const code = [];
    let i = 0;
    let minLine = (parseInt(lineObj.line) - limit) > 1 ? (lineObj.line - limit) : 1;
    let maxLine = parseInt(lineObj.line) + limit;

    const rl = readline.createInterface({
        input: fs.createReadStream(lineObj.file),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        i++
        if (i >= minLine && i <= maxLine) {
            code.push({
                code: line,
                line: i
            });
        }
    }

    return code;
}
