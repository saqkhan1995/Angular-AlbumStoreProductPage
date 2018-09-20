"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const dependentRegistration_1 = require("../utils/dependentRegistration");
const typeConverters = require("../utils/typeConverters");
class TypeScriptFormattingProvider {
    constructor(client, formattingOptionsManager) {
        this.client = client;
        this.formattingOptionsManager = formattingOptionsManager;
    }
    async provideDocumentRangeFormattingEdits(document, range, options, token) {
        const file = this.client.toPath(document.uri);
        if (!file) {
            return undefined;
        }
        await this.formattingOptionsManager.ensureConfigurationOptions(document, options, token);
        let edits;
        try {
            const args = typeConverters.Range.toFormattingRequestArgs(file, range);
            const { body } = await this.client.execute('format', args, token);
            if (!body) {
                return undefined;
            }
            edits = body;
        }
        catch (_a) {
            return undefined;
        }
        return edits.map(typeConverters.TextEdit.fromCodeEdit);
    }
    async provideOnTypeFormattingEdits(document, position, ch, options, token) {
        const file = this.client.toPath(document.uri);
        if (!file) {
            return [];
        }
        await this.formattingOptionsManager.ensureConfigurationOptions(document, options, token);
        const args = Object.assign({}, typeConverters.Position.toFileLocationRequestArgs(file, position), { key: ch });
        try {
            const { body } = await this.client.execute('formatonkey', args, token);
            const edits = body;
            const result = [];
            if (!edits) {
                return result;
            }
            for (const edit of edits) {
                const textEdit = typeConverters.TextEdit.fromCodeEdit(edit);
                const range = textEdit.range;
                // Work around for https://github.com/Microsoft/TypeScript/issues/6700.
                // Check if we have an edit at the beginning of the line which only removes white spaces and leaves
                // an empty line. Drop those edits
                if (range.start.character === 0 && range.start.line === range.end.line && textEdit.newText === '') {
                    const lText = document.lineAt(range.start.line).text;
                    // If the edit leaves something on the line keep the edit (note that the end character is exclusive).
                    // Keep it also if it removes something else than whitespace
                    if (lText.trim().length > 0 || lText.length > range.end.character) {
                        result.push(textEdit);
                    }
                }
                else {
                    result.push(textEdit);
                }
            }
            return result;
        }
        catch (_a) {
            // noop
        }
        return [];
    }
}
function register(selector, modeId, client, fileConfigurationManager) {
    return new dependentRegistration_1.ConfigurationDependentRegistration(modeId, 'format.enable', () => {
        const formattingProvider = new TypeScriptFormattingProvider(client, fileConfigurationManager);
        return vscode.Disposable.from(vscode.languages.registerOnTypeFormattingEditProvider(selector, formattingProvider, ';', '}', '\n'), vscode.languages.registerDocumentRangeFormattingEditProvider(selector, formattingProvider));
    });
}
exports.register = register;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/features\formatting.js.map
