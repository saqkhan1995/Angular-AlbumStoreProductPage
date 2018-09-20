"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const api_1 = require("../utils/api");
const dependentRegistration_1 = require("../utils/dependentRegistration");
const typeConverters = require("../utils/typeConverters");
class TypeScriptFoldingProvider {
    constructor(client) {
        this.client = client;
    }
    async provideFoldingRanges(document, _context, token) {
        const file = this.client.toPath(document.uri);
        if (!file) {
            return;
        }
        const args = { file };
        const { body } = await this.client.execute('getOutliningSpans', args, token);
        if (!body) {
            return;
        }
        return body
            .map(span => this.convertOutliningSpan(span, document))
            .filter(foldingRange => !!foldingRange);
    }
    convertOutliningSpan(span, document) {
        const range = typeConverters.Range.fromTextSpan(span.textSpan);
        const kind = TypeScriptFoldingProvider.getFoldingRangeKind(span);
        // Workaround for #49904
        if (span.kind === 'comment') {
            const line = document.lineAt(range.start.line).text;
            if (line.match(/\/\/\s*#endregion/gi)) {
                return undefined;
            }
        }
        const start = range.start.line;
        // workaround for #47240
        const end = (range.end.character > 0 && document.getText(new vscode.Range(range.end.translate(0, -1), range.end)) === '}')
            ? Math.max(range.end.line - 1, range.start.line)
            : range.end.line;
        return new vscode.FoldingRange(start, end, kind);
    }
    static getFoldingRangeKind(span) {
        switch (span.kind) {
            case 'comment': return vscode.FoldingRangeKind.Comment;
            case 'region': return vscode.FoldingRangeKind.Region;
            case 'imports': return vscode.FoldingRangeKind.Imports;
            case 'code':
            default: return undefined;
        }
    }
}
function register(selector, client) {
    return new dependentRegistration_1.VersionDependentRegistration(client, api_1.default.v280, () => {
        return vscode.languages.registerFoldingRangeProvider(selector, new TypeScriptFoldingProvider(client));
    });
}
exports.register = register;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/features\folding.js.map
