#!/usr/bin/env node --test
import assert from "node:assert/strict";
import { glob, readFile } from "node:fs/promises";
import { relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { filterOnlySpecs, formatOrSame, installDefaultFormatCodeBlock, parseSpecs } from "../test_utils/index.mjs";

import { format, set_format_code_block } from "../pkg/markdown_node.js";

installDefaultFormatCodeBlock(set_format_code_block);

const specsRoot = fileURLToPath(import.meta.resolve("../tests/specs"));

for await (const specFilePath of glob(`${specsRoot}/**/*.txt`)) {
	const relativePath = relative(specsRoot, specFilePath);
	const fileText = await readFile(specFilePath, "utf-8");
	const specs = filterOnlySpecs(parseSpecs(fileText, { defaultFileName: "file.md" }));

	for (const spec of specs) {
		const testName = `${relativePath} :: ${spec.message}`;

		if (spec.skip) {
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
