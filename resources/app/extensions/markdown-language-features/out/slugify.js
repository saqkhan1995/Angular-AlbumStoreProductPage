"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
class Slug {
    constructor(value) {
        this.value = value;
    }
    equals(other) {
        return this.value === other.value;
    }
}
exports.Slug = Slug;
exports.githubSlugifier = new class {
    fromHeading(heading) {
        const slugifiedHeading = encodeURI(heading.trim()
            .toLowerCase()
            .replace(/\s+/g, '-') // Replace whitespace with -
            .replace(/[\]\[\!\'\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝]/g, '') // Remove known puctuators
            .replace(/^\-+/, '') // Remove leading -
            .replace(/\-+$/, '') // Remove trailing -
        );
        return new Slug(slugifiedHeading);
    }
};
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\markdown-language-features\out/slugify.js.map
