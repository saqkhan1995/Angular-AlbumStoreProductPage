"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const languageModeIds = require("./languageModeIds");
var DiagnosticLanguage;
(function (DiagnosticLanguage) {
    DiagnosticLanguage[DiagnosticLanguage["JavaScript"] = 0] = "JavaScript";
    DiagnosticLanguage[DiagnosticLanguage["TypeScript"] = 1] = "TypeScript";
})(DiagnosticLanguage = exports.DiagnosticLanguage || (exports.DiagnosticLanguage = {}));
exports.allDiagnosticLangauges = [DiagnosticLanguage.JavaScript, DiagnosticLanguage.TypeScript];
exports.standardLanguageDescriptions = [
    {
        id: 'typescript',
        diagnosticOwner: 'typescript',
        diagnosticSource: 'ts',
        diagnosticLanguage: DiagnosticLanguage.TypeScript,
        modeIds: [languageModeIds.typescript, languageModeIds.typescriptreact],
        configFile: 'tsconfig.json'
    }, {
        id: 'javascript',
        diagnosticOwner: 'typescript',
        diagnosticSource: 'ts',
        diagnosticLanguage: DiagnosticLanguage.JavaScript,
        modeIds: [languageModeIds.javascript, languageModeIds.javascriptreact],
        configFile: 'jsconfig.json'
    }
];
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/utils\languageDescription.js.map
