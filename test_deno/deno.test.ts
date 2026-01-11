#!/usr/bin/env deno test --allow-read --parallel
import { assertEquals } from "jsr:@std/assert";
import { expandGlob } from "jsr:@std/fs";
import { fromFileUrl } from "jsr:@std/path";
import { filterOnlySpecs, formatOrSame, installDefaultFormatCodeBlock, parseSpecs } from "../test_utils/index.mjs";

import { format, set_format_code_block } from "../pkg/markdown_esm.js";

installDefaultFormatCodeBlock(set_format_code_block);

const specs_root = fromFileUrl(import.meta.resolve("../tests/specs"));

for await (const { path: spec_path } of expandGlob(`${specs_root}/**/*.txt`)) {
	const relativePath = spec_path.slice(specs_root.length + 1);
	const fileText = await Deno.readTextFile(spec_path);
	const specs = filterOnlySpecs(parseSpecs(fileText, { defaultFileName: "file.md" }));

	for (const spec of specs) {
		const testName = `${relativePath} :: ${spec.message}`;

		if (spec.skip) {
			Deno.test({ name: testName, ignore: true, fn: () => {} });
			continue;
		}

		Deno.test(testName, () => {
			const actual = formatOrSame(format, spec.fileText, spec.config);
			assertEquals(actual, spec.expectedText, `${testName} (1st format)`);

			if (!spec.skipFormatTwice) {
				const actualSecond = formatOrSame(format, actual, spec.config);
				assertEquals(actualSecond, spec.expectedText, `${testName} (2nd format)`);
			}
		});
	}
}
