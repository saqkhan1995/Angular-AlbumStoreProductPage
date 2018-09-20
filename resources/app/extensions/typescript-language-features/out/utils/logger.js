"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nls = require("vscode-nls");
const is = require("./is");
const memoize_1 = require("./memoize");
const localize = nls.loadMessageBundle(__filename);
class Logger {
    get output() {
        return vscode.window.createOutputChannel(localize(0, null));
    }
    data2String(data) {
        if (data instanceof Error) {
            if (is.string(data.stack)) {
                return data.stack;
            }
            return data.message;
        }
        if (is.boolean(data.success) && !data.success && is.string(data.message)) {
            return data.message;
        }
        if (is.string(data)) {
            return data;
        }
        return data.toString();
    }
    info(message, data) {
        this.logLevel('Info', message, data);
    }
    warn(message, data) {
        this.logLevel('Warn', message, data);
    }
    error(message, data) {
        // See https://github.com/Microsoft/TypeScript/issues/10496
        if (data && data.message === 'No content available.') {
            return;
        }
        this.logLevel('Error', message, data);
    }
    logLevel(level, message, data) {
        this.output.appendLine(`[${level}  - ${(new Date().toLocaleTimeString())}] ${message}`);
        if (data) {
            this.output.appendLine(this.data2String(data));
        }
    }
}
__decorate([
    memoize_1.memoize
], Logger.prototype, "output", null);
exports.default = Logger;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/utils\logger.js.map
