/* @ts-self-types="./markdown.d.ts" */
import { readFileSync } from "node:fs";
import * as import_bg from "./markdown_bg.js";
const { __wbg_set_wasm, format, set_format_code_block, ...wasmImport } = import_bg;

const wasmUrl = new URL("markdown_bg.wasm", import.meta.url);
const wasmBytes = readFileSync(wasmUrl);
const wasmModule = new WebAssembly.Module(wasmBytes);

function getImports() {
	return {
		__proto__: null,
		"./markdown_bg.js": wasmImport,
	};
}

/**
 * @import * as WASM from "./markdown.wasm"
 */

const instance = new WebAssembly.Instance(wasmModule, getImports());

/**
 * @type {WASM}
 */
const wasm = instance.exports;
__wbg_set_wasm(wasm);

export { format, set_format_code_block };
