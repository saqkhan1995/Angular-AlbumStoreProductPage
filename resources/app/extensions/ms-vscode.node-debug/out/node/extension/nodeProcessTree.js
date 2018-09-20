/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const processTree_1 = require("./processTree");
const protocolDetection_1 = require("./protocolDetection");
const pids = new Set();
const POLL_INTERVAL = 1000;
/**
 * Poll for all subprocesses of given root process.
 */
function pollProcesses(rootPid, inTerminal, cb) {
    let stopped = false;
    function poll() {
        //const start = Date.now();
        findChildProcesses(rootPid, inTerminal, cb).then(_ => {
            //console.log(`duration: ${Date.now() - start}`);
            setTimeout(_ => {
                if (!stopped) {
                    poll();
                }
            }, POLL_INTERVAL);
        });
    }
    poll();
    return new vscode.Disposable(() => stopped = true);
}
exports.pollProcesses = pollProcesses;
function attachToProcess(folder, name, pid, args, baseConfig) {
    if (pids.has(pid)) {
        return;
    }
    pids.add(pid);
    const config = {
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
    let { usePort, protocol, port } = protocolDetection_1.analyseArguments(args);
    if (usePort) {
        config.processId = `${protocol}${port}`;
    }
    else {
        if (protocol && port > 0) {
            config.processId = `${pid}${protocol}${port}`;
        }
        else {
            config.processId = pid.toString();
        }
    }
    vscode.debug.startDebugging(folder, config);
}
exports.attachToProcess = attachToProcess;
function findChildProcesses(rootPid, inTerminal, cb) {
    function walker(node, terminal, renderer) {
        if (node.args.indexOf('--type=terminal') >= 0 && (renderer === 0 || node.ppid === renderer)) {
            terminal = true;
        }
        let { protocol } = protocolDetection_1.analyseArguments(node.args);
        if (terminal && protocol) {
            cb(node.pid, node.command, node.args);
        }
        for (const child of node.children || []) {
            walker(child, terminal, renderer);
        }
    }
    function finder(node, pid) {
        if (node.pid === pid) {
            return node;
        }
        for (const child of node.children || []) {
            const p = finder(child, pid);
            if (p) {
                return p;
            }
        }
        return undefined;
    }
    return processTree_1.getProcessTree(rootPid).then(tree => {
        if (tree) {
            // find the pid of the renderer process
            const extensionHost = finder(tree, process.pid);
            let rendererPid = extensionHost ? extensionHost.ppid : 0;
            for (const child of tree.children || []) {
                walker(child, !inTerminal, rendererPid);
            }
        }
    });
}

//# sourceMappingURL=../../../out/node/extension/nodeProcessTree.js.map
