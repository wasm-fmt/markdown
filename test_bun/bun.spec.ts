#!/usr/bin/env bun test
import { Glob } from "bun";
import { expect, test } from "bun:test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { filterOnlySpecs, formatOrSame, installDefaultFormatCodeBlock, parseSpecs } from "../test_utils/index.mjs";

import init, { format, set_format_code_block } from "../pkg/markdown_web.js";

await init();
installDefaultFormatCodeBlock(set_format_code_block);

const specs_root = fileURLToPath(import.meta.resolve("../tests/specs"));

for await (const spec_path of new Glob("**/*.txt").scan({ cwd: specs_root })) {
	const fileText = await Bun.file(`${specs_root}/${spec_path}`).text();
	const specs = filterOnlySpecs(parseSpecs(fileText, { defaultFileName: "file.md" }));

	for (const spec of specs) {
		const testName = `${spec_path} :: ${spec.message}`;

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
