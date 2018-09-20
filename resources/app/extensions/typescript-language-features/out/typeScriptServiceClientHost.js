"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Includes code from typescript-sublime-plugin project, obtained from
 * https://github.com/Microsoft/TypeScript-Sublime-Plugin/blob/master/TypeScript%20Indent.tmPreferences
 * ------------------------------------------------------------------------------------------ */
const vscode = require("vscode");
const fileConfigurationManager_1 = require("./features/fileConfigurationManager");
const updatePathsOnRename_1 = require("./features/updatePathsOnRename");
const languageProvider_1 = require("./languageProvider");
const PConst = require("./protocol.const");
const typescriptServiceClient_1 = require("./typescriptServiceClient");
const api_1 = require("./utils/api");
const dispose_1 = require("./utils/dispose");
const languageDescription_1 = require("./utils/languageDescription");
const typeConverters = require("./utils/typeConverters");
const typingsStatus_1 = require("./utils/typingsStatus");
const versionStatus_1 = require("./utils/versionStatus");
// Style check diagnostics that can be reported as warnings
const styleCheckDiagnostics = [
    6133,
    6138,
    7027,
    7028,
    7029,
    7030 // not all code paths return a value
];
class TypeScriptServiceClientHost extends dispose_1.Disposable {
    constructor(descriptions, workspaceState, plugins, commandManager, logDirectoryProvider) {
        super();
        this.commandManager = commandManager;
        this.languages = [];
        this.languagePerId = new Map();
        this.reportStyleCheckAsWarnings = true;
        const handleProjectCreateOrDelete = () => {
            this.client.executeWithoutWaitingForResponse('reloadProjects', null);
            this.triggerAllDiagnostics();
        };
        const handleProjectChange = () => {
            setTimeout(() => {
                this.triggerAllDiagnostics();
            }, 1500);
        };
        const configFileWatcher = vscode.workspace.createFileSystemWatcher('**/[tj]sconfig.json');
        this._register(configFileWatcher);
        configFileWatcher.onDidCreate(handleProjectCreateOrDelete, this, this._disposables);
        configFileWatcher.onDidDelete(handleProjectCreateOrDelete, this, this._disposables);
        configFileWatcher.onDidChange(handleProjectChange, this, this._disposables);
        const allModeIds = this.getAllModeIds(descriptions);
        this.client = new typescriptServiceClient_1.default(workspaceState, version => this.versionStatus.onDidChangeTypeScriptVersion(version), plugins, logDirectoryProvider, allModeIds);
        this._register(this.client);
        this.client.onDiagnosticsReceived(({ kind, resource, diagnostics }) => {
            this.diagnosticsReceived(kind, resource, diagnostics);
        }, null, this._disposables);
        this.client.onConfigDiagnosticsReceived(diag => this.configFileDiagnosticsReceived(diag), null, this._disposables);
        this.client.onResendModelsRequested(() => this.populateService(), null, this._disposables);
        this.versionStatus = new versionStatus_1.default(resource => this.client.toPath(resource));
        this._register(this.versionStatus);
        this._register(new typingsStatus_1.AtaProgressReporter(this.client));
        this.typingsStatus = this._register(new typingsStatus_1.default(this.client));
        this.fileConfigurationManager = this._register(new fileConfigurationManager_1.default(this.client));
        for (const description of descriptions) {
            const manager = new languageProvider_1.default(this.client, description, this.commandManager, this.client.telemetryReporter, this.typingsStatus, this.fileConfigurationManager);
            this.languages.push(manager);
            this._register(manager);
            this.languagePerId.set(description.id, manager);
        }
        this._register(updatePathsOnRename_1.register(this.client, this.fileConfigurationManager, uri => this.handles(uri)));
        this.client.ensureServiceStarted();
        this.client.onReady(() => {
            if (!this.client.apiVersion.gte(api_1.default.v230)) {
                return;
            }
            const languages = new Set();
            for (const plugin of plugins) {
                for (const language of plugin.languages) {
                    languages.add(language);
                }
            }
            if (languages.size) {
                const description = {
                    id: 'typescript-plugins',
                    modeIds: Array.from(languages.values()),
                    diagnosticSource: 'ts-plugin',
                    diagnosticLanguage: languageDescription_1.DiagnosticLanguage.TypeScript,
                    diagnosticOwner: 'typescript',
                    isExternal: true
                };
                const manager = new languageProvider_1.default(this.client, description, this.commandManager, this.client.telemetryReporter, this.typingsStatus, this.fileConfigurationManager);
                this.languages.push(manager);
                this._register(manager);
                this.languagePerId.set(description.id, manager);
            }
        });
        this.client.onTsServerStarted(() => {
            this.triggerAllDiagnostics();
        });
        vscode.workspace.onDidChangeConfiguration(this.configurationChanged, this, this._disposables);
        this.configurationChanged();
    }
    getAllModeIds(descriptions) {
        const allModeIds = [];
        for (const description of descriptions) {
            allModeIds.push(...description.modeIds);
        }
        return allModeIds;
    }
    get serviceClient() {
        return this.client;
    }
    reloadProjects() {
        this.client.executeWithoutWaitingForResponse('reloadProjects', null);
        this.triggerAllDiagnostics();
    }
    async handles(resource) {
        const provider = await this.findLanguage(resource);
        if (provider) {
            return true;
        }
        return this.client.bufferSyncSupport.handles(resource);
    }
    configurationChanged() {
        const typescriptConfig = vscode.workspace.getConfiguration('typescript');
        this.reportStyleCheckAsWarnings = typescriptConfig.get('reportStyleChecksAsWarnings', true);
    }
    async findLanguage(resource) {
        try {
            const doc = await vscode.workspace.openTextDocument(resource);
            return this.languages.find(language => language.handles(resource, doc));
        }
        catch (_a) {
            return undefined;
        }
    }
    triggerAllDiagnostics() {
        for (const language of this.languagePerId.values()) {
            language.triggerAllDiagnostics();
        }
    }
    populateService() {
        this.fileConfigurationManager.reset();
        this.client.bufferSyncSupport.reOpenDocuments();
        this.client.bufferSyncSupport.requestAllDiagnostics();
        // See https://github.com/Microsoft/TypeScript/issues/5530
        vscode.workspace.saveAll(false).then(() => {
            for (const language of this.languagePerId.values()) {
                language.reInitialize();
            }
        });
    }
    async diagnosticsReceived(kind, resource, diagnostics) {
        const language = await this.findLanguage(resource);
        if (language) {
            language.diagnosticsReceived(kind, resource, this.createMarkerDatas(diagnostics, language.diagnosticSource));
        }
    }
    configFileDiagnosticsReceived(event) {
        // See https://github.com/Microsoft/TypeScript/issues/10384
        const body = event.body;
        if (!body || !body.diagnostics || !body.configFile) {
            return;
        }
        (this.findLanguage(this.client.toResource(body.configFile))).then(language => {
            if (!language) {
                return;
            }
            if (body.diagnostics.length === 0) {
                language.configFileDiagnosticsReceived(this.client.toResource(body.configFile), []);
            }
            else if (body.diagnostics.length >= 1) {
                vscode.workspace.openTextDocument(vscode.Uri.file(body.configFile)).then((document) => {
                    let curly = undefined;
                    let nonCurly = undefined;
                    let diagnostic;
                    for (let index = 0; index < document.lineCount; index++) {
                        const line = document.lineAt(index);
                        const text = line.text;
                        const firstNonWhitespaceCharacterIndex = line.firstNonWhitespaceCharacterIndex;
                        if (firstNonWhitespaceCharacterIndex < text.length) {
                            if (text.charAt(firstNonWhitespaceCharacterIndex) === '{') {
                                curly = [index, firstNonWhitespaceCharacterIndex, firstNonWhitespaceCharacterIndex + 1];
                                break;
                            }
                            else {
                                const matches = /\s*([^\s]*)(?:\s*|$)/.exec(text.substr(firstNonWhitespaceCharacterIndex));
                                if (matches && matches.length >= 1) {
                                    nonCurly = [index, firstNonWhitespaceCharacterIndex, firstNonWhitespaceCharacterIndex + matches[1].length];
                                }
                            }
                        }
                    }
                    const match = curly || nonCurly;
                    if (match) {
                        diagnostic = new vscode.Diagnostic(new vscode.Range(match[0], match[1], match[0], match[2]), body.diagnostics[0].text);
                    }
                    else {
                        diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), body.diagnostics[0].text);
                    }
                    if (diagnostic) {
                        diagnostic.source = language.diagnosticSource;
                        language.configFileDiagnosticsReceived(this.client.toResource(body.configFile), [diagnostic]);
                    }
                }, _error => {
                    language.configFileDiagnosticsReceived(this.client.toResource(body.configFile), [new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), body.diagnostics[0].text)]);
                });
            }
        });
    }
    createMarkerDatas(diagnostics, source) {
        return diagnostics.map(tsDiag => this.tsDiagnosticToVsDiagnostic(tsDiag, source));
    }
    tsDiagnosticToVsDiagnostic(diagnostic, source) {
        const { start, end, text } = diagnostic;
        const range = new vscode.Range(typeConverters.Position.fromLocation(start), typeConverters.Position.fromLocation(end));
        const converted = new vscode.Diagnostic(range, text);
        converted.severity = this.getDiagnosticSeverity(diagnostic);
        converted.source = diagnostic.source || source;
        if (diagnostic.code) {
            converted.code = diagnostic.code;
        }
        const relatedInformation = diagnostic.relatedInformation;
        if (relatedInformation) {
            converted.relatedInformation = relatedInformation.map((info) => {
                let span = info.span;
                if (!span) {
                    return undefined;
                }
                return new vscode.DiagnosticRelatedInformation(typeConverters.Location.fromTextSpan(this.client.toResource(span.file), span), info.message);
            }).filter((x) => !!x);
        }
        if (diagnostic.reportsUnnecessary) {
            converted.tags = [vscode.DiagnosticTag.Unnecessary];
        }
        converted.reportUnnecessary = diagnostic.reportsUnnecessary;
        return converted;
    }
    getDiagnosticSeverity(diagnostic) {
        if (this.reportStyleCheckAsWarnings
            && this.isStyleCheckDiagnostic(diagnostic.code)
            && diagnostic.category === PConst.DiagnosticCategory.error) {
            return vscode.DiagnosticSeverity.Warning;
        }
        switch (diagnostic.category) {
            case PConst.DiagnosticCategory.error:
                return vscode.DiagnosticSeverity.Error;
            case PConst.DiagnosticCategory.warning:
                return vscode.DiagnosticSeverity.Warning;
            case PConst.DiagnosticCategory.suggestion:
                return vscode.DiagnosticSeverity.Hint;
            default:
                return vscode.DiagnosticSeverity.Error;
        }
    }
    isStyleCheckDiagnostic(code) {
        return code ? styleCheckDiagnostics.indexOf(code) !== -1 : false;
    }
}
exports.default = TypeScriptServiceClientHost;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/typeScriptServiceClientHost.js.map
