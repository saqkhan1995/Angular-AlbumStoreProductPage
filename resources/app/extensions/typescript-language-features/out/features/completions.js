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
const PConst = require("../protocol.const");
const api_1 = require("../utils/api");
const codeAction_1 = require("../utils/codeAction");
const Previewer = require("../utils/previewer");
const typeConverters = require("../utils/typeConverters");
const memoize_1 = require("../utils/memoize");
const cancellation_1 = require("../utils/cancellation");
const localize = nls.loadMessageBundle(__filename);
class MyCompletionItem extends vscode.CompletionItem {
    constructor(position, document, line, tsEntry, useCodeSnippetsOnMethodSuggest, commitCharactersSettings) {
        super(tsEntry.name, MyCompletionItem.convertKind(tsEntry.kind));
        this.position = position;
        this.document = document;
        this.tsEntry = tsEntry;
        this.commitCharactersSettings = commitCharactersSettings;
        if (tsEntry.isRecommended) {
            // Make sure isRecommended property always comes first
            // https://github.com/Microsoft/vscode/issues/40325
            this.sortText = tsEntry.sortText;
            this.preselect = true;
        }
        else if (tsEntry.source) {
            // De-prioritze auto-imports
            // https://github.com/Microsoft/vscode/issues/40311
            this.sortText = '\uffff' + tsEntry.sortText;
        }
        else {
            this.sortText = tsEntry.sortText;
        }
        this.position = position;
        this.useCodeSnippet = useCodeSnippetsOnMethodSuggest && (this.kind === vscode.CompletionItemKind.Function || this.kind === vscode.CompletionItemKind.Method);
        if (tsEntry.replacementSpan) {
            this.range = typeConverters.Range.fromTextSpan(tsEntry.replacementSpan);
        }
        if (tsEntry.insertText) {
            this.insertText = tsEntry.insertText;
            if (tsEntry.replacementSpan) {
                this.range = typeConverters.Range.fromTextSpan(tsEntry.replacementSpan);
                if (this.insertText[0] === '[') { // o.x -> o['x']
                    this.filterText = '.' + this.label;
                }
                // Make sure we only replace a single line at most
                if (!this.range.isSingleLine) {
                    this.range = new vscode.Range(this.range.start.line, this.range.start.character, this.range.start.line, line.length);
                }
            }
        }
        if (tsEntry.kindModifiers && tsEntry.kindModifiers.match(/\boptional\b/)) {
            if (!this.insertText) {
                this.insertText = this.label;
            }
            if (!this.filterText) {
                this.filterText = this.label;
            }
            this.label += '?';
        }
        this.resolveRange(line);
    }
    resolveRange(line) {
        if (this.range) {
            return;
        }
        // Try getting longer, prefix based range for completions that span words
        const wordRange = this.document.getWordRangeAtPosition(this.position);
        const text = line.slice(Math.max(0, this.position.character - this.label.length), this.position.character).toLowerCase();
        const entryName = this.label.toLowerCase();
        for (let i = entryName.length; i >= 0; --i) {
            if (text.endsWith(entryName.substr(0, i)) && (!wordRange || wordRange.start.character > this.position.character - i)) {
                this.range = new vscode.Range(this.position.line, Math.max(0, this.position.character - i), this.position.line, this.position.character);
                break;
            }
        }
    }
    static convertKind(kind) {
        switch (kind) {
            case PConst.Kind.primitiveType:
            case PConst.Kind.keyword:
                return vscode.CompletionItemKind.Keyword;
            case PConst.Kind.const:
                return vscode.CompletionItemKind.Constant;
            case PConst.Kind.let:
            case PConst.Kind.variable:
            case PConst.Kind.localVariable:
            case PConst.Kind.alias:
                return vscode.CompletionItemKind.Variable;
            case PConst.Kind.memberVariable:
            case PConst.Kind.memberGetAccessor:
            case PConst.Kind.memberSetAccessor:
                return vscode.CompletionItemKind.Field;
            case PConst.Kind.function:
                return vscode.CompletionItemKind.Function;
            case PConst.Kind.memberFunction:
            case PConst.Kind.constructSignature:
            case PConst.Kind.callSignature:
            case PConst.Kind.indexSignature:
                return vscode.CompletionItemKind.Method;
            case PConst.Kind.enum:
                return vscode.CompletionItemKind.Enum;
            case PConst.Kind.module:
            case PConst.Kind.externalModuleName:
                return vscode.CompletionItemKind.Module;
            case PConst.Kind.class:
            case PConst.Kind.type:
                return vscode.CompletionItemKind.Class;
            case PConst.Kind.interface:
                return vscode.CompletionItemKind.Interface;
            case PConst.Kind.warning:
            case PConst.Kind.script:
                return vscode.CompletionItemKind.File;
            case PConst.Kind.directory:
                return vscode.CompletionItemKind.Folder;
            case PConst.Kind.string:
                return vscode.CompletionItemKind.Constant;
        }
        return vscode.CompletionItemKind.Property;
    }
    get commitCharacters() {
        if (!this.commitCharactersSettings.enabled) {
            return undefined;
        }
        const commitCharacters = [];
        switch (this.tsEntry.kind) {
            case PConst.Kind.memberGetAccessor:
            case PConst.Kind.memberSetAccessor:
            case PConst.Kind.constructSignature:
            case PConst.Kind.callSignature:
            case PConst.Kind.indexSignature:
            case PConst.Kind.enum:
            case PConst.Kind.interface:
                if (this.commitCharactersSettings.enableDotCompletions) {
                    commitCharacters.push('.');
                }
                break;
            case PConst.Kind.module:
            case PConst.Kind.alias:
            case PConst.Kind.const:
            case PConst.Kind.let:
            case PConst.Kind.variable:
            case PConst.Kind.localVariable:
            case PConst.Kind.memberVariable:
            case PConst.Kind.class:
            case PConst.Kind.function:
            case PConst.Kind.memberFunction:
                if (this.commitCharactersSettings.enableDotCompletions) {
                    commitCharacters.push('.', ',');
                }
                if (this.commitCharactersSettings.enableCallCompletions) {
                    commitCharacters.push('(');
                }
                break;
        }
        return commitCharacters.length === 0 ? undefined : commitCharacters;
    }
}
__decorate([
    memoize_1.memoize
], MyCompletionItem.prototype, "commitCharacters", null);
class ApplyCompletionCodeActionCommand {
    constructor(client) {
        this.client = client;
        this.id = ApplyCompletionCodeActionCommand.ID;
    }
    async execute(_file, codeActions) {
        if (codeActions.length === 0) {
            return true;
        }
        if (codeActions.length === 1) {
            return codeAction_1.applyCodeAction(this.client, codeActions[0], cancellation_1.nulToken);
        }
        const selection = await vscode.window.showQuickPick(codeActions.map((action, i) => ({
            label: action.description,
            description: '',
            index: i
        })), {
            placeHolder: localize(0, null)
        });
        if (!selection) {
            return false;
        }
        const action = codeActions[selection.index];
        if (!action) {
            return false;
        }
        return codeAction_1.applyCodeAction(this.client, action, cancellation_1.nulToken);
    }
}
ApplyCompletionCodeActionCommand.ID = '_typescript.applyCompletionCodeAction';
var CompletionConfiguration;
(function (CompletionConfiguration) {
    CompletionConfiguration.useCodeSnippetsOnMethodSuggest = 'useCodeSnippetsOnMethodSuggest';
    CompletionConfiguration.nameSuggestions = 'nameSuggestions';
    CompletionConfiguration.quickSuggestionsForPaths = 'quickSuggestionsForPaths';
    CompletionConfiguration.autoImportSuggestions = 'autoImportSuggestions.enabled';
    function getConfigurationForResource(resource) {
        // TS settings are shared by both JS and TS.
        const typeScriptConfig = vscode.workspace.getConfiguration('typescript', resource);
        return {
            useCodeSnippetsOnMethodSuggest: typeScriptConfig.get(CompletionConfiguration.useCodeSnippetsOnMethodSuggest, false),
            quickSuggestionsForPaths: typeScriptConfig.get(CompletionConfiguration.quickSuggestionsForPaths, true),
            autoImportSuggestions: typeScriptConfig.get(CompletionConfiguration.autoImportSuggestions, true),
            nameSuggestions: vscode.workspace.getConfiguration('javascript', resource).get(CompletionConfiguration.nameSuggestions, true)
        };
    }
    CompletionConfiguration.getConfigurationForResource = getConfigurationForResource;
})(CompletionConfiguration || (CompletionConfiguration = {}));
class TypeScriptCompletionItemProvider {
    constructor(client, typingsStatus, fileConfigurationManager, commandManager) {
        this.client = client;
        this.typingsStatus = typingsStatus;
        this.fileConfigurationManager = fileConfigurationManager;
        commandManager.register(new ApplyCompletionCodeActionCommand(this.client));
    }
    async provideCompletionItems(document, position, token, context) {
        if (this.typingsStatus.isAcquiringTypings) {
            return Promise.reject({
                label: localize(1, null),
                detail: localize(2, null)
            });
        }
        const file = this.client.toPath(document.uri);
        if (!file) {
            return null;
        }
        const line = document.lineAt(position.line);
        const completionConfiguration = CompletionConfiguration.getConfigurationForResource(document.uri);
        if (!this.shouldTrigger(context, completionConfiguration, line, position)) {
            return null;
        }
        await this.client.interuptGetErr(() => this.fileConfigurationManager.ensureConfigurationForDocument(document, token));
        const args = Object.assign({}, typeConverters.Position.toFileLocationRequestArgs(file, position), { includeExternalModuleExports: completionConfiguration.autoImportSuggestions, includeInsertTextCompletions: true, triggerCharacter: context.triggerCharacter });
        let enableCommitCharacters = true;
        let msg = undefined;
        try {
            if (this.client.apiVersion.gte(api_1.default.v300)) {
                const { body } = await this.client.interuptGetErr(() => this.client.execute('completionInfo', args, token));
                if (!body) {
                    return null;
                }
                enableCommitCharacters = !body.isNewIdentifierLocation;
                msg = body.entries;
            }
            else {
                const { body } = await this.client.interuptGetErr(() => this.client.execute('completions', args, token));
                if (!body) {
                    return null;
                }
                msg = body;
            }
        }
        catch (_a) {
            return null;
        }
        const enableDotCompletions = this.shouldEnableDotCompletions(document, position);
        return msg
            .filter(entry => !shouldExcludeCompletionEntry(entry, completionConfiguration))
            .map(entry => new MyCompletionItem(position, document, line.text, entry, completionConfiguration.useCodeSnippetsOnMethodSuggest, {
            enabled: enableCommitCharacters,
            enableDotCompletions,
            enableCallCompletions: !completionConfiguration.useCodeSnippetsOnMethodSuggest
        }));
    }
    async resolveCompletionItem(item, token) {
        if (!(item instanceof MyCompletionItem)) {
            return undefined;
        }
        const filepath = this.client.toPath(item.document.uri);
        if (!filepath) {
            return undefined;
        }
        const args = Object.assign({}, typeConverters.Position.toFileLocationRequestArgs(filepath, item.position), { entryNames: [
                item.tsEntry.source ? { name: item.tsEntry.name, source: item.tsEntry.source } : item.tsEntry.name
            ] });
        let details;
        try {
            const { body } = await this.client.execute('completionEntryDetails', args, token);
            details = body;
        }
        catch (_a) {
            return item;
        }
        if (!details || !details.length || !details[0]) {
            return item;
        }
        const detail = details[0];
        item.detail = detail.displayParts.length ? Previewer.plain(detail.displayParts) : undefined;
        item.documentation = this.getDocumentation(detail, item);
        const { command, additionalTextEdits } = this.getCodeActions(detail, filepath);
        item.command = command;
        item.additionalTextEdits = additionalTextEdits;
        if (detail && item.useCodeSnippet) {
            const shouldCompleteFunction = await this.isValidFunctionCompletionContext(filepath, item.position, token);
            if (shouldCompleteFunction) {
                item.insertText = this.snippetForFunctionCall(item, detail);
            }
        }
        return item;
    }
    getCodeActions(detail, filepath) {
        if (!detail.codeActions || !detail.codeActions.length) {
            return {};
        }
        // Try to extract out the additionalTextEdits for the current file.
        // Also check if we still have to apply other workspace edits and commands
        // using a vscode command
        const additionalTextEdits = [];
        let hasReaminingCommandsOrEdits = false;
        for (const tsAction of detail.codeActions) {
            if (tsAction.commands) {
                hasReaminingCommandsOrEdits = true;
            }
            // Apply all edits in the current file using `additionalTextEdits`
            if (tsAction.changes) {
                for (const change of tsAction.changes) {
                    if (change.fileName === filepath) {
                        additionalTextEdits.push(...change.textChanges.map(typeConverters.TextEdit.fromCodeEdit));
                    }
                    else {
                        hasReaminingCommandsOrEdits = true;
                    }
                }
            }
        }
        let command = undefined;
        if (hasReaminingCommandsOrEdits) {
            // Create command that applies all edits not in the current file.
            command = {
                title: '',
                command: ApplyCompletionCodeActionCommand.ID,
                arguments: [filepath, detail.codeActions.map((x) => ({
                        commands: x.commands,
                        description: x.description,
                        changes: x.changes.filter(x => x.fileName !== filepath)
                    }))]
            };
        }
        return {
            command,
            additionalTextEdits: additionalTextEdits.length ? additionalTextEdits : undefined
        };
    }
    shouldEnableDotCompletions(document, position) {
        // TODO: Workaround for https://github.com/Microsoft/TypeScript/issues/13456
        // Only enable dot completions when previous character is an identifier.
        // Prevents incorrectly completing while typing spread operators.
        if (position.character > 1) {
            const preText = document.getText(new vscode.Range(position.line, 0, position.line, position.character - 1));
            return preText.match(/[a-z_$\(\)\[\]\{\}]\s*$/ig) !== null;
        }
        return true;
    }
    shouldTrigger(context, config, line, position) {
        if (context.triggerCharacter && !this.client.apiVersion.gte(api_1.default.v290)) {
            if ((context.triggerCharacter === '"' || context.triggerCharacter === '\'')) {
                if (!config.quickSuggestionsForPaths) {
                    return false;
                }
                // make sure we are in something that looks like the start of an import
                const pre = line.text.slice(0, position.character);
                if (!pre.match(/\b(from|import)\s*["']$/) && !pre.match(/\b(import|require)\(['"]$/)) {
                    return false;
                }
            }
            if (context.triggerCharacter === '/') {
                if (!config.quickSuggestionsForPaths) {
                    return false;
                }
                // make sure we are in something that looks like an import path
                const pre = line.text.slice(0, position.character);
                if (!pre.match(/\b(from|import)\s*["'][^'"]*$/) && !pre.match(/\b(import|require)\(['"][^'"]*$/)) {
                    return false;
                }
            }
            if (context.triggerCharacter === '@') {
                // make sure we are in something that looks like the start of a jsdoc comment
                const pre = line.text.slice(0, position.character);
                if (!pre.match(/^\s*\*[ ]?@/) && !pre.match(/\/\*\*+[ ]?@/)) {
                    return false;
                }
            }
            if (context.triggerCharacter === '<') {
                return false;
            }
        }
        return true;
    }
    getDocumentation(detail, item) {
        const documentation = new vscode.MarkdownString();
        if (detail.source) {
            const importPath = `'${Previewer.plain(detail.source)}'`;
            const autoImportLabel = localize(3, null, importPath);
            item.detail = `${autoImportLabel}\n${item.detail}`;
        }
        Previewer.addMarkdownDocumentation(documentation, detail.documentation, detail.tags);
        return documentation.value.length ? documentation : undefined;
    }
    async isValidFunctionCompletionContext(filepath, position, token) {
        // Workaround for https://github.com/Microsoft/TypeScript/issues/12677
        // Don't complete function calls inside of destructive assigments or imports
        try {
            const { body } = await this.client.execute('quickinfo', typeConverters.Position.toFileLocationRequestArgs(filepath, position), token);
            switch (body && body.kind) {
                case 'var':
                case 'let':
                case 'const':
                case 'alias':
                    return false;
                default:
                    return true;
            }
        }
        catch (e) {
            return true;
        }
    }
    snippetForFunctionCall(item, detail) {
        let hasOptionalParameters = false;
        let hasAddedParameters = false;
        const snippet = new vscode.SnippetString();
        const methodName = detail.displayParts.find(part => part.kind === 'methodName');
        if (item.insertText) {
            if (typeof item.insertText === 'string') {
                snippet.appendText(item.insertText);
            }
            else {
                return item.insertText;
            }
        }
        else {
            snippet.appendText((methodName && methodName.text) || item.label);
        }
        snippet.appendText('(');
        let parenCount = 0;
        let i = 0;
        for (; i < detail.displayParts.length; ++i) {
            const part = detail.displayParts[i];
            // Only take top level paren names
            if (part.kind === 'parameterName' && parenCount === 1) {
                const next = detail.displayParts[i + 1];
                // Skip optional parameters
                const nameIsFollowedByOptionalIndicator = next && next.text === '?';
                if (!nameIsFollowedByOptionalIndicator) {
                    if (hasAddedParameters) {
                        snippet.appendText(', ');
                    }
                    hasAddedParameters = true;
                    snippet.appendPlaceholder(part.text);
                }
                hasOptionalParameters = hasOptionalParameters || nameIsFollowedByOptionalIndicator;
            }
            else if (part.kind === 'punctuation') {
                if (part.text === '(') {
                    ++parenCount;
                }
                else if (part.text === ')') {
                    --parenCount;
                }
                else if (part.text === '...' && parenCount === 1) {
                    // Found rest parmeter. Do not fill in any further arguments
                    hasOptionalParameters = true;
                    break;
                }
            }
        }
        if (hasOptionalParameters) {
            snippet.appendTabstop();
        }
        snippet.appendText(')');
        snippet.appendTabstop(0);
        return snippet;
    }
}
TypeScriptCompletionItemProvider.triggerCharacters = ['.', '"', '\'', '/', '@', '<'];
function shouldExcludeCompletionEntry(element, completionConfiguration) {
    return ((!completionConfiguration.nameSuggestions && element.kind === PConst.Kind.warning)
        || (!completionConfiguration.quickSuggestionsForPaths &&
            (element.kind === PConst.Kind.directory || element.kind === PConst.Kind.script))
        || (!completionConfiguration.autoImportSuggestions && element.hasAction));
}
function register(selector, client, typingsStatus, fileConfigurationManager, commandManager) {
    return vscode.languages.registerCompletionItemProvider(selector, new TypeScriptCompletionItemProvider(client, typingsStatus, fileConfigurationManager, commandManager), ...TypeScriptCompletionItemProvider.triggerCharacters);
}
exports.register = register;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/features\completions.js.map
