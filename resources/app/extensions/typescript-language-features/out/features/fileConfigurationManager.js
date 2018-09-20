"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const api_1 = require("../utils/api");
const languageModeIds_1 = require("../utils/languageModeIds");
const resourceMap_1 = require("../utils/resourceMap");
function objsAreEqual(a, b) {
    let keys = Object.keys(a);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}
function areFileConfigurationsEqual(a, b) {
    return (objsAreEqual(a.formatOptions, b.formatOptions)
        && objsAreEqual(a.preferences, b.preferences));
}
class FileConfigurationManager {
    constructor(client) {
        this.client = client;
        this.formatOptions = new resourceMap_1.ResourceMap();
        this.onDidCloseTextDocumentSub = vscode.workspace.onDidCloseTextDocument((textDocument) => {
            // When a document gets closed delete the cached formatting options.
            // This is necessary since the tsserver now closed a project when its
            // last file in it closes which drops the stored formatting options
            // as well.
            this.formatOptions.delete(textDocument.uri);
        });
    }
    dispose() {
        if (this.onDidCloseTextDocumentSub) {
            this.onDidCloseTextDocumentSub.dispose();
            this.onDidCloseTextDocumentSub = undefined;
        }
    }
    async ensureConfigurationForDocument(document, token) {
        const formattingOptions = this.getFormattingOptions(document);
        if (formattingOptions) {
            return this.ensureConfigurationOptions(document, formattingOptions, token);
        }
    }
    getFormattingOptions(document) {
        const editor = vscode.window.visibleTextEditors.find(editor => editor.document.fileName === document.fileName);
        return editor
            ? {
                tabSize: editor.options.tabSize,
                insertSpaces: editor.options.insertSpaces
            }
            : undefined;
    }
    async ensureConfigurationOptions(document, options, token) {
        const file = this.client.toPath(document.uri);
        if (!file) {
            return;
        }
        const cachedOptions = this.formatOptions.get(document.uri);
        const currentOptions = this.getFileOptions(document, options);
        if (cachedOptions && areFileConfigurationsEqual(cachedOptions, currentOptions)) {
            return;
        }
        this.formatOptions.set(document.uri, currentOptions);
        const args = Object.assign({ file }, currentOptions);
        await this.client.execute('configure', args, token);
    }
    async setGlobalConfigurationFromDocument(document, token) {
        const formattingOptions = this.getFormattingOptions(document);
        if (!formattingOptions) {
            return;
        }
        const args = Object.assign({ file: undefined /*global*/ }, this.getFileOptions(document, formattingOptions));
        await this.client.execute('configure', args, token);
    }
    reset() {
        this.formatOptions.clear();
    }
    getFileOptions(document, options) {
        return {
            formatOptions: this.getFormatOptions(document, options),
            preferences: this.getPreferences(document)
        };
    }
    getFormatOptions(document, options) {
        const config = vscode.workspace.getConfiguration(languageModeIds_1.isTypeScriptDocument(document) ? 'typescript.format' : 'javascript.format', document.uri);
        return {
            tabSize: options.tabSize,
            indentSize: options.tabSize,
            convertTabsToSpaces: options.insertSpaces,
            // We can use \n here since the editor normalizes later on to its line endings.
            newLineCharacter: '\n',
            insertSpaceAfterCommaDelimiter: config.get('insertSpaceAfterCommaDelimiter'),
            insertSpaceAfterConstructor: config.get('insertSpaceAfterConstructor'),
            insertSpaceAfterSemicolonInForStatements: config.get('insertSpaceAfterSemicolonInForStatements'),
            insertSpaceBeforeAndAfterBinaryOperators: config.get('insertSpaceBeforeAndAfterBinaryOperators'),
            insertSpaceAfterKeywordsInControlFlowStatements: config.get('insertSpaceAfterKeywordsInControlFlowStatements'),
            insertSpaceAfterFunctionKeywordForAnonymousFunctions: config.get('insertSpaceAfterFunctionKeywordForAnonymousFunctions'),
            insertSpaceBeforeFunctionParenthesis: config.get('insertSpaceBeforeFunctionParenthesis'),
            insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: config.get('insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis'),
            insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: config.get('insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets'),
            insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: config.get('insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces'),
            insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: config.get('insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces'),
            insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: config.get('insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces'),
            insertSpaceAfterTypeAssertion: config.get('insertSpaceAfterTypeAssertion'),
            placeOpenBraceOnNewLineForFunctions: config.get('placeOpenBraceOnNewLineForFunctions'),
            placeOpenBraceOnNewLineForControlBlocks: config.get('placeOpenBraceOnNewLineForControlBlocks'),
        };
    }
    getPreferences(document) {
        if (!this.client.apiVersion.gte(api_1.default.v290)) {
            return {};
        }
        const preferences = vscode.workspace.getConfiguration(languageModeIds_1.isTypeScriptDocument(document) ? 'typescript.preferences' : 'javascript.preferences', document.uri);
        return {
            quotePreference: getQuoteStylePreference(preferences),
            importModuleSpecifierPreference: getImportModuleSpecifierPreference(preferences),
            allowTextChangesInNewFiles: document.uri.scheme === 'file'
        };
    }
}
exports.default = FileConfigurationManager;
function getQuoteStylePreference(config) {
    switch (config.get('quoteStyle')) {
        case 'single': return 'single';
        case 'double': return 'double';
        default: return undefined;
    }
}
function getImportModuleSpecifierPreference(config) {
    switch (config.get('importModuleSpecifier')) {
        case 'relative': return 'relative';
        case 'non-relative': return 'non-relative';
        default: return undefined;
    }
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/features\fileConfigurationManager.js.map
