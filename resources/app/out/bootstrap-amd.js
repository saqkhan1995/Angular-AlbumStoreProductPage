/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function uriFromPath(e){var n=path.resolve(e).replace(/\\/g,"/");return n.length>0&&"/"!==n.charAt(0)&&(n="/"+n),encodeURI("file://"+n)}function readFile(e){return new Promise(function(n,r){fs.readFile(e,"utf8",function(e,o){e?r(e):n(o)})})}var path=require("path"),fs=require("fs"),loader=require("./vs/loader");const writeFile=(e,n)=>new Promise((r,o)=>fs.writeFile(e,n,"utf8",e=>e?o(e):r()));var rawNlsConfig=process.env.VSCODE_NLS_CONFIG,nlsConfig=rawNlsConfig?JSON.parse(rawNlsConfig):{availableLanguages:{}};if(nlsConfig._resolvedLanguagePackCoreLocation){let e=Object.create(null);nlsConfig.loadBundle=function(n,r,o){let i=e[n];if(i)return void o(void 0,i);readFile(path.join(nlsConfig._resolvedLanguagePackCoreLocation,n.replace(/\//g,"!")+".nls.json")).then(function(r){let i=JSON.parse(r);e[n]=i,o(void 0,i)}).catch(e=>{try{nlsConfig._corruptedFile&&writeFile(nlsConfig._corruptedFile,"corrupted").catch(function(e){console.error(e)})}finally{o(e,void 0)}})}}loader.config({baseUrl:uriFromPath(__dirname),
catchError:!0,nodeRequire:require,nodeMain:__filename,"vs/nls":nlsConfig,nodeCachedDataDir:process.env["VSCODE_NODE_CACHED_DATA_DIR_"+process.pid]}),(process.env.ELECTRON_RUN_AS_NODE||process.versions.electron)&&loader.define("fs",["original-fs"],function(e){return e}),nlsConfig.pseudo&&loader(["vs/nls"],function(e){e.setPseudoTranslation(nlsConfig.pseudo)}),exports.bootstrap=function(e,n,r){e&&loader([e],n=n||function(){},r=r||function(e){console.error(e)})};
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/493869ee8e8a846b0855873886fc79d480d342de/core/bootstrap-amd.js.map
