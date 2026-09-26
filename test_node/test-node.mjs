#!/usr/bin/env node --test
import assert from "node:assert/strict";
import { glob, readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { filterOnlySpecs, formatOrSame, parseSpecs, requiresFormatCodeBlock } from "../test_utils/index.mjs";

import { createConfig, format, releaseConfig } from "../pkg/markdown_node.js";

const specs_root = fileURLToPath(import.meta.resolve("../tests/specs"));

for await (const spec_path of glob("**/*.txt", { cwd: specs_root })) {
	const fileText = await readFile(`${specs_root}/${spec_path}`, "utf-8");
	const specs = filterOnlySpecs(parseSpecs(fileText, { defaultFileName: "file.md" }));

	for (const spec of specs) {
		const testName = `${spec_path} :: ${spec.message}`;

		if (spec.skip || requiresFormatCodeBlock(spec)) {
			test(testName, { skip: true }, () => {});
			continue;
		}

		test(testName, () => {
			const actual = formatOrSame(format, spec.fileText, spec.config);
			assert.strictEqual(actual, spec.expectedText);

			if (!spec.skipFormatTwice) {
				const actualSecond = formatOrSame(format, actual, spec.config);
				assert.strictEqual(actualSecond, spec.expectedText);
			}
		});
	}
}

test("registered config handle", () => {
	const config = createConfig({ textWrap: "never" });
	try {
		assert.equal(format("#  Hello", config), "# Hello\n");
	} finally {
		releaseConfig(config);
	}
});

test("invalid JSON config is rejected during registration", () => {
	assert.throws(() => createConfig("{"), /EOF while parsing an object/);
});

test("embedded code fences and YAML front matter use virtual filenames and width hints", () => {
	const calls = [];
	const source = "---\nx:  1\n---\n\n```python\nx=1\n```\n";
	const result = format(
		source,
		{ lineWidth: 80 },
		{
			onFormatEmbedded(request) {
				calls.push(request);
				return request.filename === "embedded.yaml" ? "x: 1\n" : "x = 1\n";
			},
		},
	);
	assert.match(result, /x: 1/);
	assert.match(result, /x = 1/);
	assert.deepEqual(
		calls.map((x) => x.filename),
		["embedded.yaml", "embedded.py"],
	);
	assert.ok(calls.every((x) => x.lineWidth > 0 && x.lineWidth <= 80));
});

test("embedded handler errors propagate despite upstream swallowing them", () => {
	let calls = 0;
	assert.throws(
		() =>
			format("```python\nx=1\n```\n\n```go\nx\n```", undefined, {
				onFormatEmbedded() {
					calls++;
					throw new Error("embedded syntax error");
				},
			}),
		/embedded syntax error/,
	);
	assert.equal(calls, 1);
	assert.match(format("```python\nx=1\n```"), /x=1/);
	assert.match(format("```python\nx=1\n```", undefined, { onFormatEmbedded: () => "x = 1\n" }), /x = 1/);
});

test("custom tags, unknown tags, and successful empty embedded results", () => {
	let filename;
	const result = format(
		"```custom\nx\n```",
		{ tags: { custom: "py" } },
		{
			onFormatEmbedded(request) {
				filename = request.filename;
				return "";
			},
		},
	);
	assert.equal(filename, "embedded.py");
	assert.doesNotMatch(result, /\nx\n/);
	assert.doesNotThrow(() =>
		format("```unknown-language\nx\n```", undefined, {
			onFormatEmbedded() {
				throw new Error("must not dispatch");
			},
		}),
	);
});
