/* @ts-self-types="./markdown.d.ts" */
// prettier-ignore
import source wasmModule from "./markdown_bg.wasm";

import * as import_bg from "./markdown_bg.js";
const { __wbg_set_wasm, format, set_format_code_block, ...wasmImport } = import_bg;

function getImports() {
	return {
		__proto__: null,
		"./markdown_bg.js": wasmImport,
	};
}

const instance = new WebAssembly.Instance(wasmModule, getImports());

/**
 * @import * as WASM from "./markdown_bg.wasm"
 */

/**
 * @type {WASM}
 */
const wasm = instance.exports;
__wbg_set_wasm(wasm);

export { format, set_format_code_block };
