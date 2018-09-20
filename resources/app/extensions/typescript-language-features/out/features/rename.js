"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const typeConverters = require("../utils/typeConverters");
class TypeScriptRenameProvider {
    constructor(client) {
        this.client = client;
    }
    async provideRenameEdits(document, position, newName, token) {
        const file = this.client.toPath(document.uri);
        if (!file) {
            return null;
        }
        const args = Object.assign({}, typeConverters.Position.toFileLocationRequestArgs(file, position), { findInStrings: false, findInComments: false });
        try {
            const { body } = await this.client.execute('rename', args, token);
            if (!body) {
                return null;
            }
            const renameInfo = body.info;
            if (!renameInfo.canRename) {
                return Promise.reject(renameInfo.localizedErrorMessage);
            }
            return this.toWorkspaceEdit(body.locs, newName);
        }
        catch (_a) {
            // noop
        }
        return null;
    }
    toWorkspaceEdit(locations, newName) {
        const result = new vscode.WorkspaceEdit();
        for (const spanGroup of locations) {
            const resource = this.client.toResource(spanGroup.file);
            if (resource) {
                for (const textSpan of spanGroup.locs) {
                    result.replace(resource, typeConverters.Range.fromTextSpan(textSpan), newName);
                }
            }
        }
        return result;
    }
}
function register(selector, client) {
    return vscode.languages.registerRenameProvider(selector, new TypeScriptRenameProvider(client));
}
exports.register = register;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/features\rename.js.map
