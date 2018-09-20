/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var child_process_1 = require("child_process");
var path_1 = require("path");
var ProcessTreeNode = /** @class */ (function () {
    function ProcessTreeNode(pid, ppid, command, args) {
        this.pid = pid;
        this.ppid = ppid;
        this.command = command;
        this.args = args;
    }
    return ProcessTreeNode;
}());
exports.ProcessTreeNode = ProcessTreeNode;
function getProcessTree(rootPid) {
    return __awaiter(this, void 0, void 0, function () {
        var e_1, _a, map, err_1, values, values_1, values_1_1, p, parent;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    map = new Map();
                    map.set(0, new ProcessTreeNode(0, 0, '???', ''));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getProcesses(function (pid, ppid, command, args) {
                            if (pid !== ppid) {
                                map.set(pid, new ProcessTreeNode(pid, ppid, command, args));
                            }
                        })];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    return [2 /*return*/, undefined];
                case 4:
                    values = map.values();
                    try {
                        for (values_1 = __values(values), values_1_1 = values_1.next(); !values_1_1.done; values_1_1 = values_1.next()) {
                            p = values_1_1.value;
                            parent = map.get(p.ppid);
                            if (parent && parent !== p) {
                                if (!parent.children) {
                                    parent.children = [];
                                }
                                parent.children.push(p);
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (values_1_1 && !values_1_1.done && (_a = values_1.return)) _a.call(values_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    if (!isNaN(rootPid) && rootPid > 0) {
                        return [2 /*return*/, map.get(rootPid)];
                    }
                    return [2 /*return*/, map.get(0)];
            }
        });
    });
}
exports.getProcessTree = getProcessTree;
function getProcesses(one) {
    // returns a function that aggregates chunks of data until one or more complete lines are received and passes them to a callback.
    function lines(callback) {
        var unfinished = ''; // unfinished last line of chunk
        return function (data) {
            var e_2, _a;
            var lines = data.toString().split(/\r?\n/);
            var finishedLines = lines.slice(0, lines.length - 1);
            finishedLines[0] = unfinished + finishedLines[0]; // complete previous unfinished line
            unfinished = lines[lines.length - 1]; // remember unfinished last line of this chunk for next round
            try {
                for (var finishedLines_1 = __values(finishedLines), finishedLines_1_1 = finishedLines_1.next(); !finishedLines_1_1.done; finishedLines_1_1 = finishedLines_1.next()) {
                    var s = finishedLines_1_1.value;
                    callback(s);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (finishedLines_1_1 && !finishedLines_1_1.done && (_a = finishedLines_1.return)) _a.call(finishedLines_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        };
    }
    return new Promise(function (resolve, reject) {
        var proc;
        if (process.platform === 'win32') {
            // attributes columns are in alphabetic order!
            var CMD_PAT_1 = /^(.*)\s+([0-9]+)\.[0-9]+[+-][0-9]+\s+([0-9]+)\s+([0-9]+)$/;
            var wmic = path_1.join(process.env['WINDIR'] || 'C:\\Windows', 'System32', 'wbem', 'WMIC.exe');
            proc = child_process_1.spawn(wmic, ['process', 'get', 'CommandLine,CreationDate,ParentProcessId,ProcessId']);
            proc.stdout.setEncoding('utf8');
            proc.stdout.on('data', lines(function (line) {
                var matches = CMD_PAT_1.exec(line.trim());
                if (matches && matches.length === 5) {
                    var pid = Number(matches[4]);
                    var ppid = Number(matches[3]);
                    var date = Number(matches[2]);
                    var args = matches[1].trim();
                    if (!isNaN(pid) && !isNaN(ppid) && args) {
                        var command = args;
                        if (args[0] === '"') {
                            var end = args.indexOf('"', 1);
                            if (end > 0) {
                                command = args.substr(1, end - 1);
                                args = args.substr(end + 2);
                            }
                        }
                        else {
                            var end = args.indexOf(' ');
                            if (end > 0) {
                                command = args.substr(0, end);
                                args = args.substr(end + 1);
                            }
                            else {
                                args = '';
                            }
                        }
                        one(pid, ppid, command, args, date);
                    }
                }
            }));
        }
        else if (process.platform === 'darwin') { // OS X
            proc = child_process_1.spawn('/bin/ps', ['-x', '-o', "pid,ppid,comm=" + 'a'.repeat(256) + ",command"]);
            proc.stdout.setEncoding('utf8');
            proc.stdout.on('data', lines(function (line) {
                var pid = Number(line.substr(0, 5));
                var ppid = Number(line.substr(6, 5));
                var command = line.substr(12, 256).trim();
                var args = line.substr(269 + command.length);
                if (!isNaN(pid) && !isNaN(ppid)) {
                    one(pid, ppid, command, args);
                }
            }));
        }
        else { // linux
            proc = child_process_1.spawn('/bin/ps', ['-ax', '-o', 'pid,ppid,comm:20,command']);
            proc.stdout.setEncoding('utf8');
            proc.stdout.on('data', lines(function (line) {
                var pid = Number(line.substr(0, 5));
                var ppid = Number(line.substr(6, 5));
                var command = line.substr(12, 20).trim();
                var args = line.substr(33);
                var pos = args.indexOf(command);
                if (pos >= 0) {
                    pos = pos + command.length;
                    while (pos < args.length) {
                        if (args[pos] === ' ') {
                            break;
                        }
                        pos++;
                    }
                    command = args.substr(0, pos);
                    args = args.substr(pos + 1);
                }
                if (!isNaN(pid) && !isNaN(ppid)) {
                    one(pid, ppid, command, args);
                }
            }));
        }
        proc.on('error', function (err) {
            reject(err);
        });
        proc.stderr.setEncoding('utf8');
        proc.stderr.on('data', function (data) {
            reject(new Error(data.toString()));
        });
        proc.on('close', function (code, signal) {
            if (code === 0) {
                resolve();
            }
            else if (code > 0) {
                reject(new Error("process terminated with exit code: " + code));
            }
            if (signal) {
                reject(new Error("process terminated with signal: " + signal));
            }
        });
        proc.on('exit', function (code, signal) {
            if (code === 0) {
                //resolve();
            }
            else if (code > 0) {
                reject(new Error("process terminated with exit code: " + code));
            }
            if (signal) {
                reject(new Error("process terminated with signal: " + signal));
            }
        });
    });
}
exports.getProcesses = getProcesses;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\debug-auto-launch\out/processTree.js.map
