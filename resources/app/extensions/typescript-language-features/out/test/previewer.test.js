"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
require("mocha");
const previewer_1 = require("../utils/previewer");
suite('typescript.previewer', () => {
    test('Should ignore hyphens after a param tag', async () => {
        assert.strictEqual(previewer_1.tagsMarkdownPreview([
            {
                name: 'param',
                text: 'a - b'
            }
        ]), '*@param* `a` — b');
    });
});
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\typescript-language-features\out/test\previewer.test.js.map
