#!/usr/bin/env deno test --allow-read --parallel
import { assertEquals } from "jsr:@std/assert";
import { expandGlob } from "jsr:@std/fs";
import { fromFileUrl, relative } from "jsr:@std/path";
import { filterOnlySpecs, formatOrSame, parseSpecs, requiresFormatCodeBlock } from "../test_utils/index.mjs";

import { format } from "../pkg/markdown_esm.js";

const specs_root = fromFileUrl(import.meta.resolve("../tests/specs"));

for await (const { path: spec_path } of expandGlob("**/*.txt", {
	root: specs_root,
})) {
	const relativePath = relative(specs_root, spec_path);
	const fileText = await Deno.readTextFile(spec_path);
	const specs = filterOnlySpecs(parseSpecs(fileText, { defaultFileName: "file.md" }));

	for (const spec of specs) {
		const testName = `${relativePath} :: ${spec.message}`;

		if (spec.skip || requiresFormatCodeBlock(spec)) {
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
