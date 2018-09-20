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
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class InputBoxImpl {
    constructor(inputBox) {
        this.inputBox = inputBox;
    }
    set value(value) { this.inputBox.value = value; }
    get value() { return this.inputBox.value; }
}
exports.InputBoxImpl = InputBoxImpl;
class RepositoryImpl {
    constructor(repository) {
        this.rootUri = vscode_1.Uri.file(repository.root);
        this.inputBox = new InputBoxImpl(repository.inputBox);
    }
}
exports.RepositoryImpl = RepositoryImpl;
class APIImpl {
    constructor(model) {
        this.model = model;
    }
    getGitPath() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.git.path;
        });
    }
    getRepositories() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.repositories.map(repository => new RepositoryImpl(repository));
        });
    }
}
exports.APIImpl = APIImpl;
class NoopAPIImpl {
    getGitPath() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Git model not found');
        });
    }
    getRepositories() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('Git model not found');
        });
    }
}
exports.NoopAPIImpl = NoopAPIImpl;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\git\out/api.js.map
