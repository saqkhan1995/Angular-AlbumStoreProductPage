"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const typeConverters = require("../utils/typeConverters");
class TypeScriptDocumentHighlightProvider {
    constructor(client) {
        this.client = client;
    }
    async provideDocumentHighlights(resource, position, token) {
        const file = this.client.toPath(resource.uri);
        if (!file) {
            return [];
        }
        const args = typeConverters.Position.toFileLocationRequestArgs(file, position);
        let items;
        try {
            const { body } = await this.client.execute('occurrences', args, token);
            if (!body) {
                return [];
            }
            items = body;
        }
        catch (_a) {
            return [];
        }
        return items
            .filter(x => !x.isInString)
            .map(documentHighlightFromOccurance);
    }
}
function documentHighlightFromOccurance(occurrence) {
    return new vscode.DocumentHighlight(typeConverters.Range.fromTextSpan(occurrence), occurrence.isWriteAccess ? vscode.DocumentHighlightKind.Write : vscode.DocumentHighlightKind.Read);
}
function register(selector, client) {
    return vscode.languages.registerDocumentHighlightProvider(selector, new TypeScriptDocumentHighlightProvider(client));
}
exports.register = register;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/features\documentHighlight.js.map
