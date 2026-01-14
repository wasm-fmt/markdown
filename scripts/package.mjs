#!/usr/bin/env node
import process from "node:process";
import path from "node:path";
import fs from "node:fs";

const pkg_path = path.resolve(process.cwd(), process.argv[2]);
const pkg_text = fs.readFileSync(pkg_path, { encoding: "utf-8" });
const pkg_json = JSON.parse(pkg_text);

delete pkg_json.files;

pkg_json.main = pkg_json.module;
pkg_json.type = "module";
pkg_json.publishConfig = {
	access: "public",
};
pkg_json.exports = {
	// Deno
	// - 2.6 supports wasm source phase imports
	// - 2.1 support wasm instance phase imports
	// Node.js
	// - 24.5.0 unflag source phase imports for webassembly
	// - 24.0.0 supports source phase imports for webassembly
	// - 22.19.0 backport source/instance phase imports for webassembly
	".": {
		types: "./markdown.d.ts",
		webpack: "./markdown.js",
		deno: "./markdown.js",
		// CJS supports
		"module-sync": "./markdown_node.js",
		default: "./markdown_esm.js",
	},
	"./esm": {
		types: "./markdown.d.ts",
		default: "./markdown_esm.js",
	},
	"./node": {
		types: "./markdown.d.ts",
		default: "./markdown_node.js",
	},
	"./bundler": {
		types: "./markdown.d.ts",
		default: "./markdown.js",
	},
	"./web": {
		types: "./markdown_web.d.ts",
		default: "./markdown_web.js",
	},
	"./vite": {
		types: "./markdown_web.d.ts",
		default: "./markdown_vite.js",
	},
	"./wasm": "./markdown_bg.wasm",
	"./package.json": "./package.json",
	"./*": "./*",
};
pkg_json.sideEffects = ["./markdown.js", "./markdown_node.js", "./markdown_esm.js"];

fs.writeFileSync(pkg_path, JSON.stringify(pkg_json, null, "\t"));

// JSR
const jsr_path = path.resolve(pkg_path, "..", "jsr.jsonc");
pkg_json.name = "@fmt/markdown";
pkg_json.exports = {
	".": "./markdown.js",
	"./esm": "./markdown_esm.js",
	"./node": "./markdown_node.js",
	"./bundler": "./markdown.js",
	"./web": "./markdown_web.js",
	// jsr does not support imports from wasm?init
	// "./vite": "./markdown_vite.js",
};
pkg_json.exclude = ["!**", "*.tgz"];
fs.writeFileSync(jsr_path, JSON.stringify(pkg_json, null, "\t"));

const markdown_path = path.resolve(path.dirname(pkg_path), "markdown.js");
prependTextToFile('/* @ts-self-types="./markdown.d.ts" */\n', markdown_path);

const markdown_d_ts_path = path.resolve(path.dirname(pkg_path), "markdown.d.ts");
const doc_path = path.resolve(import.meta.dirname, "doc.d.ts");
const doc_text = fs.readFileSync(doc_path, { encoding: "utf-8" });
prependTextToFile(doc_text + "\n", markdown_d_ts_path);

function prependTextToFile(text, filePath) {
	const originalContent = fs.readFileSync(filePath, { encoding: "utf-8" });
	const newContent = text + originalContent;
	fs.writeFileSync(filePath, newContent);
}
