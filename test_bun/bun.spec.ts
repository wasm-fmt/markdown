#!/usr/bin/env bun test
import { Glob } from "bun";
import { expect, test } from "bun:test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { filterOnlySpecs, formatOrSame, installDefaultFormatCodeBlock, parseSpecs } from "../test_utils/index.mjs";

import init, { format, set_format_code_block } from "../pkg/markdown_web.js";

await init();
installDefaultFormatCodeBlock(set_format_code_block);

const specsRoot = fileURLToPath(import.meta.resolve("../tests/specs"));
const glob = new Glob("**/*.txt");

for await (const relativePath of glob.scan({ cwd: specsRoot })) {
	const specFilePath = join(specsRoot, relativePath);
	const fileText = await Bun.file(specFilePath).text();
	const specs = filterOnlySpecs(parseSpecs(fileText, { defaultFileName: "file.md" }));

	for (const spec of specs) {
		const testName = `${relativePath} :: ${spec.message}`;

		if (spec.skip) {
			test.skip(testName, () => {});
			continue;
		}

		test(testName, () => {
			const actual = formatOrSame(format, spec.fileText, spec.config);
			expect(actual).toBe(spec.expectedText);

			if (!spec.skipFormatTwice) {
				const actualSecond = formatOrSame(format, actual, spec.config);
				expect(actualSecond).toBe(spec.expectedText);
			}
		});
	}
}
