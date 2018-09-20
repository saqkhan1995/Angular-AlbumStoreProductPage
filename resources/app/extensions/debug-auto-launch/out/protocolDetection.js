/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSPECTOR_PORT_DEFAULT = 9229;
exports.LEGACY_PORT_DEFAULT = 5858;
/*
 * analyse the given command line arguments and extract debug port and protocol from it.
 */
function analyseArguments(args) {
    var DEBUG_FLAGS_PATTERN = /--(inspect|debug)(-brk)?(=((\[[0-9a-fA-F:]*\]|[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|[a-zA-Z0-9\.]*):)?(\d+))?/;
    var DEBUG_PORT_PATTERN = /--(inspect|debug)-port=(\d+)/;
    var result = {
        usePort: false,
        port: -1
    };
    // match --debug, --debug=1234, --debug-brk, debug-brk=1234, --inspect, --inspect=1234, --inspect-brk, --inspect-brk=1234
    var matches = DEBUG_FLAGS_PATTERN.exec(args);
    if (matches && matches.length >= 2) {
        // attach via port
        result.usePort = true;
        if (matches.length >= 6 && matches[5]) {
            result.address = matches[5];
        }
        if (matches.length >= 7 && matches[6]) {
            result.port = parseInt(matches[6]);
        }
        result.protocol = matches[1] === 'debug' ? 'legacy' : 'inspector';
    }
    // a debug-port=1234 or --inspect-port=1234 overrides the port
    matches = DEBUG_PORT_PATTERN.exec(args);
    if (matches && matches.length === 3) {
        // override port
        result.port = parseInt(matches[2]);
        result.protocol = matches[1] === 'debug' ? 'legacy' : 'inspector';
    }
    if (result.port < 0) {
        result.port = result.protocol === 'inspector' ? exports.INSPECTOR_PORT_DEFAULT : exports.LEGACY_PORT_DEFAULT;
    }
    return result;
}
exports.analyseArguments = analyseArguments;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/extensions\debug-auto-launch\out/protocolDetection.js.map
