/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var nls = require("vscode-nls");
var path_1 = require("path");
var nodeProcessTree_1 = require("./nodeProcessTree");
var localize = nls.loadMessageBundle(__filename);
var ON_TEXT = localize(0, null);
var OFF_TEXT = localize(1, null);
var TOGGLE_COMMAND = 'extension.node-debug.toggleAutoAttach';
var currentState;
var autoAttacher;
var statusItem = undefined;
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand(TOGGLE_COMMAND, toggleAutoAttach));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(function (e) {
        if (e.affectsConfiguration('debug.node.autoAttach')) {
            updateAutoAttachInStatus(context);
        }
    }));
    updateAutoAttachInStatus(context);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
function toggleAutoAttach(context) {
    var conf = vscode.workspace.getConfiguration('debug.node');
    var value = conf.get('autoAttach');
    if (value === 'on') {
        value = 'off';
    }
    else {
        value = 'on';
    }
    var info = conf.inspect('autoAttach');
    var target = vscode.ConfigurationTarget.Global;
    if (info) {
        if (info.workspaceFolderValue) {
            target = vscode.ConfigurationTarget.WorkspaceFolder;
        }
        else if (info.workspaceValue) {
            target = vscode.ConfigurationTarget.Workspace;
        }
        else if (info.globalValue) {
            target = vscode.ConfigurationTarget.Global;
        }
        else if (info.defaultValue) {
            // setting not yet used: store setting in workspace
            if (vscode.workspace.workspaceFolders) {
                target = vscode.ConfigurationTarget.Workspace;
            }
        }
    }
    conf.update('autoAttach', value, target);
    updateAutoAttachInStatus(context);
}
function updateAutoAttachInStatus(context) {
    var newState = vscode.workspace.getConfiguration('debug.node').get('autoAttach');
    if (newState !== currentState) {
        currentState = newState;
        if (newState === 'disabled') {
            // turn everything off
            if (statusItem) {
                statusItem.hide();
                statusItem.text = OFF_TEXT;
            }
            if (autoAttacher) {
                autoAttacher.dispose();
                autoAttacher = undefined;
            }
        }
        else { // 'on' or 'off'
            // make sure status bar item exists and is visible
            if (!statusItem) {
                statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
                statusItem.command = TOGGLE_COMMAND;
                statusItem.text = OFF_TEXT;
                statusItem.tooltip = localize(2, null);
                statusItem.show();
                context.subscriptions.push(statusItem);
            }
            else {
                statusItem.show();
            }
            if (newState === 'off') {
                statusItem.text = OFF_TEXT;
                if (autoAttacher) {
                    autoAttacher.dispose();
                    autoAttacher = undefined;
                }
            }
            else if (newState === 'on') {
                statusItem.text = ON_TEXT;
                var vscode_pid = process.env['VSCODE_PID'];
                var rootPid = vscode_pid ? parseInt(vscode_pid) : 0;
                autoAttacher = startAutoAttach(rootPid);
            }
        }
    }
}
function startAutoAttach(rootPid) {
    return nodeProcessTree_1.pollProcesses(rootPid, true, function (pid, cmdPath, args) {
        var cmdName = path_1.basename(cmdPath, '.exe');
        if (cmdName === 'node') {
            var name = localize(3, null, pid);
            nodeProcessTree_1.attachToProcess(undefined, name, pid, args);
        }
    });
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\debug-auto-launch\out/extension.js.map
