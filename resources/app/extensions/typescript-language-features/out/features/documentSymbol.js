"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const PConst = require("../protocol.const");
const typeConverters = require("../utils/typeConverters");
const getSymbolKind = (kind) => {
    switch (kind) {
        case PConst.Kind.module: return vscode.SymbolKind.Module;
        case PConst.Kind.class: return vscode.SymbolKind.Class;
        case PConst.Kind.enum: return vscode.SymbolKind.Enum;
        case PConst.Kind.interface: return vscode.SymbolKind.Interface;
        case PConst.Kind.memberFunction: return vscode.SymbolKind.Method;
        case PConst.Kind.memberVariable: return vscode.SymbolKind.Property;
        case PConst.Kind.memberGetAccessor: return vscode.SymbolKind.Property;
        case PConst.Kind.memberSetAccessor: return vscode.SymbolKind.Property;
        case PConst.Kind.variable: return vscode.SymbolKind.Variable;
        case PConst.Kind.const: return vscode.SymbolKind.Variable;
        case PConst.Kind.localVariable: return vscode.SymbolKind.Variable;
        case PConst.Kind.variable: return vscode.SymbolKind.Variable;
        case PConst.Kind.function: return vscode.SymbolKind.Function;
        case PConst.Kind.localFunction: return vscode.SymbolKind.Function;
    }
    return vscode.SymbolKind.Variable;
};
class TypeScriptDocumentSymbolProvider {
    constructor(client) {
        this.client = client;
    }
    async provideDocumentSymbols(resource, token) {
        const file = this.client.toPath(resource.uri);
        if (!file) {
            return undefined;
        }
        let tree;
        try {
            const args = { file };
            const { body } = await this.client.execute('navtree', args, token);
            if (!body) {
                return undefined;
            }
            tree = body;
        }
        catch (_a) {
            return undefined;
        }
        if (tree && tree.childItems) {
            // The root represents the file. Ignore this when showing in the UI
            const result = [];
            tree.childItems.forEach(item => TypeScriptDocumentSymbolProvider.convertNavTree(resource.uri, result, item));
            return result;
        }
        return undefined;
    }
    static convertNavTree(resource, bucket, item) {
        let shouldInclude = TypeScriptDocumentSymbolProvider.shouldInclueEntry(item);
        const children = new Set(item.childItems || []);
        for (const span of item.spans) {
            const range = typeConverters.Range.fromTextSpan(span);
            const symbolInfo = new vscode.DocumentSymbol(item.text, '', getSymbolKind(item.kind), range, range);
            for (const child of children) {
                if (child.spans.some(span => !!range.intersection(typeConverters.Range.fromTextSpan(span)))) {
                    const includedChild = TypeScriptDocumentSymbolProvider.convertNavTree(resource, symbolInfo.children, child);
                    shouldInclude = shouldInclude || includedChild;
                    children.delete(child);
                }
            }
            if (shouldInclude) {
                bucket.push(symbolInfo);
            }
        }
        return shouldInclude;
    }
    static shouldInclueEntry(item) {
        if (item.kind === PConst.Kind.alias) {
            return false;
        }
        return !!(item.text && item.text !== '<function>' && item.text !== '<class>');
    }
}
function register(selector, client) {
    return vscode.languages.registerDocumentSymbolProvider(selector, new TypeScriptDocumentSymbolProvider(client));
}
exports.register = register;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/features\documentSymbol.js.map
