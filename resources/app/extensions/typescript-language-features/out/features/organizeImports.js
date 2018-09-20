"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nls = require("vscode-nls");
const api_1 = require("../utils/api");
const dependentRegistration_1 = require("../utils/dependentRegistration");
const typeconverts = require("../utils/typeConverters");
const cancellation_1 = require("../utils/cancellation");
const localize = nls.loadMessageBundle(__filename);
class OrganizeImportsCommand {
    constructor(client, telemetryReporter) {
        this.client = client;
        this.telemetryReporter = telemetryReporter;
        this.id = OrganizeImportsCommand.Id;
    }
    async execute(file) {
        /* __GDPR__
            "organizeImports.execute" : {
                "${include}": [
                    "${TypeScriptCommonProperties}"
                ]
            }
        */
        this.telemetryReporter.logTelemetry('organizeImports.execute', {});
        const args = {
            scope: {
                type: 'file',
                args: {
                    file
                }
            }
        };
        const { body } = await this.client.execute('organizeImports', args, cancellation_1.nulToken);
        const edits = typeconverts.WorkspaceEdit.fromFileCodeEdits(this.client, body);
        return vscode.workspace.applyEdit(edits);
    }
}
OrganizeImportsCommand.Id = '_typescript.organizeImports';
class OrganizeImportsCodeActionProvider {
    constructor(client, commandManager, fileConfigManager, telemetryReporter) {
        this.client = client;
        this.fileConfigManager = fileConfigManager;
        this.metadata = {
            providedCodeActionKinds: [vscode.CodeActionKind.SourceOrganizeImports]
        };
        commandManager.register(new OrganizeImportsCommand(client, telemetryReporter));
    }
    provideCodeActions(document, _range, context, token) {
        const file = this.client.toPath(document.uri);
        if (!file) {
            return [];
        }
        if (!context.only || !context.only.contains(vscode.CodeActionKind.SourceOrganizeImports)) {
            return [];
        }
        this.fileConfigManager.ensureConfigurationForDocument(document, token);
        const action = new vscode.CodeAction(localize(0, null), vscode.CodeActionKind.SourceOrganizeImports);
        action.command = { title: '', command: OrganizeImportsCommand.Id, arguments: [file] };
        return [action];
    }
}
exports.OrganizeImportsCodeActionProvider = OrganizeImportsCodeActionProvider;
function register(selector, client, commandManager, fileConfigurationManager, telemetryReporter) {
    return new dependentRegistration_1.VersionDependentRegistration(client, api_1.default.v280, () => {
        const organizeImportsProvider = new OrganizeImportsCodeActionProvider(client, commandManager, fileConfigurationManager, telemetryReporter);
        return vscode.languages.registerCodeActionsProvider(selector, organizeImportsProvider, organizeImportsProvider.metadata);
    });
}
exports.register = register;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/features\organizeImports.js.map
