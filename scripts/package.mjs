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
	".": {
		types: "./markdown.d.ts",
		node: "./markdown_node.js",
		webpack: "./markdown.js",
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

fs.writeFileSync(pkg_path, JSON.stringify(pkg_json, null, "\t"));

// JSR
const jsr_path = path.resolve(pkg_path, "..", "jsr.jsonc");
pkg_json.name = "@fmt/markdown";
pkg_json.exports = {
	".": "./markdown_esm.js",
	"./esm": "./markdown_esm.js",
	"./node": "./markdown_node.js",
	"./bundler": "./markdown.js",
	"./web": "./markdown_web.js",
	// jsr does not support imports from wasm?init
	// "./vite": "./markdown_vite.js",
	"./wasm": "./markdown_bg.wasm",
};
pkg_json.exclude = ["!**", "*.tgz"];
fs.writeFileSync(jsr_path, JSON.stringify(pkg_json, null, "\t"));

const markdown_path = path.resolve(path.dirname(pkg_path), "markdown.js");
let markdown_text = fs.readFileSync(markdown_path, { encoding: "utf-8" });
fs.writeFileSync(markdown_path, '/* @ts-self-types="./markdown.d.ts" */\n' + markdown_text);
