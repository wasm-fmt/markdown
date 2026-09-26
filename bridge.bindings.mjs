import { defineBindings } from "@wasm-fmt/bindgen";

export default defineBindings({
	name: "markdown",
	wasm: "target/wasm32-unknown-unknown/release/markdown.wasm",
	wasmFile: "markdown_bg.wasm",
	adapter: "bindings/markdown_binding.js",
	types: {
		main: "bindings/markdown.d.ts",
	},
	assets: [
		"package.json",
		"jsr.jsonc",
		"README.md",
		"LICENSE-MIT",
		"LICENSE-APACHE",
		"bindings/.npmignore",
		"bindings/markdown_config.d.ts",
	],
	outDir: "pkg",
	clean: true,
});
