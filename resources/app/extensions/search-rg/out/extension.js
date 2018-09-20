"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var ripgrepFileSearch_1 = require("./ripgrepFileSearch");
var ripgrepTextSearch_1 = require("./ripgrepTextSearch");
var utils_1 = require("./utils");
function activate() {
    if (vscode.workspace.getConfiguration('searchRipgrep').get('enable')) {
        var outputChannel = vscode.window.createOutputChannel('search-rg');
        var provider = new RipgrepSearchProvider(outputChannel);
        vscode.workspace.registerFileIndexProvider('file', provider);
        vscode.workspace.registerTextSearchProvider('file', provider);
    }
}
exports.activate = activate;
var RipgrepSearchProvider = /** @class */ (function () {
    function RipgrepSearchProvider(outputChannel) {
        var _this = this;
        this.outputChannel = outputChannel;
        this.inProgress = new Set();
        process.once('exit', function () { return _this.dispose(); });
    }
    RipgrepSearchProvider.prototype.provideTextSearchResults = function (query, options, progress, token) {
        var engine = new ripgrepTextSearch_1.RipgrepTextSearchEngine(this.outputChannel);
        return this.withEngine(engine, function () { return engine.provideTextSearchResults(query, options, progress, token); });
    };
    RipgrepSearchProvider.prototype.provideFileIndex = function (options, token) {
        var engine = new ripgrepFileSearch_1.RipgrepFileSearchEngine(this.outputChannel);
        var results = [];
        var onResult = function (relativePathMatch) {
            results.push(utils_1.joinPath(options.folder, relativePathMatch));
        };
        return this.withEngine(engine, function () { return engine.provideFileSearchResults(options, { report: onResult }, token); })
            .then(function () { return results; });
    };
    RipgrepSearchProvider.prototype.withEngine = function (engine, fn) {
        var _this = this;
        this.inProgress.add(engine);
        return fn().then(function () {
            _this.inProgress.delete(engine);
        });
    };
    RipgrepSearchProvider.prototype.dispose = function () {
        this.inProgress.forEach(function (engine) { return engine.cancel(); });
    };
    return RipgrepSearchProvider;
}());
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\search-rg\out/extension.js.map
