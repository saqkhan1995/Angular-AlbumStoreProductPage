/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var processTree_1 = require("./processTree");
var protocolDetection_1 = require("./protocolDetection");
var pids = new Set();
var POLL_INTERVAL = 1000;
/**
 * Poll for all subprocesses of given root process.
 */
function pollProcesses(rootPid, inTerminal, cb) {
    var stopped = false;
    function poll() {
        //const start = Date.now();
        findChildProcesses(rootPid, inTerminal, cb).then(function (_) {
            //console.log(`duration: ${Date.now() - start}`);
            setTimeout(function (_) {
                if (!stopped) {
                    poll();
                }
            }, POLL_INTERVAL);
        });
    }
    poll();
    return new vscode.Disposable(function () { return stopped = true; });
}
exports.pollProcesses = pollProcesses;
function attachToProcess(folder, name, pid, args, baseConfig) {
    if (pids.has(pid)) {
        return;
    }
    pids.add(pid);
    var config = {
        type: 'node',
        request: 'attach',
        name: name,
        stopOnEntry: false
    };
    if (baseConfig) {
        // selectively copy attributes
        if (baseConfig.timeout) {
            config.timeout = baseConfig.timeout;
        }
        if (baseConfig.sourceMaps) {
            config.sourceMaps = baseConfig.sourceMaps;
        }
        if (baseConfig.outFiles) {
            config.outFiles = baseConfig.outFiles;
        }
        if (baseConfig.sourceMapPathOverrides) {
            config.sourceMapPathOverrides = baseConfig.sourceMapPathOverrides;
        }
        if (baseConfig.smartStep) {
            config.smartStep = baseConfig.smartStep;
        }
        if (baseConfig.skipFiles) {
            config.skipFiles = baseConfig.skipFiles;
        }
        if (baseConfig.showAsyncStacks) {
            config.sourceMaps = baseConfig.showAsyncStacks;
        }
        if (baseConfig.trace) {
            config.trace = baseConfig.trace;
        }
    }
    var _a = protocolDetection_1.analyseArguments(args), usePort = _a.usePort, protocol = _a.protocol, port = _a.port;
    if (usePort) {
        config.processId = "" + protocol + port;
    }
    else {
        if (protocol && port > 0) {
            config.processId = "" + pid + protocol + port;
        }
        else {
            config.processId = pid.toString();
        }
    }
    vscode.debug.startDebugging(folder, config);
}
exports.attachToProcess = attachToProcess;
function findChildProcesses(rootPid, inTerminal, cb) {
    function walker(node, terminal, terminalPids) {
        var e_1, _a;
        if (terminalPids.indexOf(node.pid) >= 0) {
            terminal = true; // found the terminal shell
        }
        var protocol = protocolDetection_1.analyseArguments(node.args).protocol;
        if (terminal && protocol) {
            cb(node.pid, node.command, node.args);
        }
        try {
            for (var _b = __values(node.children || []), _c = _b.next(); !_c.done; _c = _b.next()) {
                var child = _c.value;
                walker(child, terminal, terminalPids);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    return processTree_1.getProcessTree(rootPid).then(function (tree) {
        if (tree) {
            var terminals = vscode.window.terminals;
            if (terminals.length > 0) {
                Promise.all(terminals.map(function (terminal) { return terminal.processId; })).then(function (terminalPids) {
                    walker(tree, !inTerminal, terminalPids);
                });
            }
        }
    });
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\debug-auto-launch\out/nodeProcessTree.js.map
