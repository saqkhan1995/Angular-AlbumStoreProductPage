"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const api_1 = require("../utils/api");
const typeConverters = require("../utils/typeConverters");
const definitionProviderBase_1 = require("./definitionProviderBase");
class TypeScriptDefinitionProvider extends definitionProviderBase_1.default {
    constructor(client) {
        super(client);
    }
    async provideDefinition(document, position, token) {
        if (this.client.apiVersion.gte(api_1.default.v270)) {
            const filepath = this.client.toPath(document.uri);
            if (!filepath) {
                return undefined;
            }
            const args = typeConverters.Position.toFileLocationRequestArgs(filepath, position);
            try {
                const { body } = await this.client.execute('definitionAndBoundSpan', args, token);
                if (!body) {
                    return undefined;
                }
                const span = body.textSpan ? typeConverters.Range.fromTextSpan(body.textSpan) : undefined;
                return body.definitions
                    .map(location => {
                    const target = typeConverters.Location.fromTextSpan(this.client.toResource(location.file), location);
                    return {
                        originSelectionRange: span,
                        targetRange: target.range,
                        targetUri: target.uri,
                    };
                });
            }
            catch (_a) {
                return [];
            }
        }
        return this.getSymbolLocations('definition', document, position, token);
    }
}
exports.default = TypeScriptDefinitionProvider;
function register(selector, client) {
    return vscode.languages.registerDefinitionProvider(selector, new TypeScriptDefinitionProvider(client));
}
exports.register = register;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/features\definitions.js.map
