const DEFAULT_SPEC_FILE_NAME = "file.md";

export function installDefaultFormatCodeBlock(set_format_code_block) {
	set_format_code_block((tag, text, lineWidth) => {
		const end = `_formatted_${lineWidth}`;
		if (tag === "format" && !text.endsWith(end)) {
			return `${text}${end}\n\n`;
		}
		return null;
	});
}

export function formatOrSame(format, fileText, config) {
	const result = format(fileText, config);
	return result === undefined ? fileText : result;
}

export function runSpecCase(spec, { format, assertEquals, formatTwice = true } = {}) {
	const actual = formatOrSame(format, spec.fileText, spec.config);
	assertEquals(actual, spec.expectedText);

	if (formatTwice && !spec.skipFormatTwice) {
		const actualSecond = formatOrSame(format, actual, spec.config);
		assertEquals(actualSecond, spec.expectedText);
	}
}

export function parseSpecs(fileText, { defaultFileName = DEFAULT_SPEC_FILE_NAME } = {}) {
	// Keep parity with dprint-development:
	// - normalize CRLF to LF (but don't touch standalone CR)
	// - optional file path header: `-- path --`
	// - optional config header: `~~ ... ~~`
	// - message separator depends on file name (.md => !!, else ==)
	fileText = fileText.replace(/\r\n/g, "\n");

	const { fileName, remainingText: fileTextAfterPath } = parseFilePath(fileText, defaultFileName);
	const { config, remainingText: fileTextAfterConfig } = parseConfig(fileTextAfterPath);

	const lines = fileTextAfterConfig.split("\n");
	const specStarts = getSpecStarts(fileName, lines);

	/** @type {Array<ReturnType<typeof parseSingleSpec>>} */
	const specs = [];
	for (let i = 0; i < specStarts.length; i++) {
		const startIndex = specStarts[i];
		const endIndex = i + 1 === specStarts.length ? lines.length : specStarts[i + 1];
		const messageLine = lines[startIndex];
		const specLines = lines.slice(startIndex + 1, endIndex);
		specs.push(parseSingleSpec(fileName, messageLine, specLines, config));
	}

	return specs;
}

export function filterOnlySpecs(specs) {
	return specs.some((s) => s.isOnly) ? specs.filter((s) => s.isOnly) : specs;
}

function parseFilePath(fileText, defaultFileName) {
	if (!fileText.startsWith("--")) {
		return { fileName: defaultFileName, remainingText: fileText };
	}

	const lastIndex = fileText.indexOf("--\n");
	if (lastIndex === -1) {
		throw new Error("Could not find final --");
	}

	const fileName = fileText.slice("--".length, lastIndex).trim();
	const remainingText = fileText.slice(lastIndex + "--\n".length);
	return { fileName, remainingText };
}

function parseConfig(fileText) {
	if (!fileText.startsWith("~~")) {
		return { config: {}, remainingText: fileText };
	}

	const lastIndex = fileText.indexOf("~~\n");
	if (lastIndex === -1) {
		throw new Error("Could not find final ~~\\n");
	}

	const configTextRaw = fileText.slice("~~".length, lastIndex).replace(/\n/g, "");
	const configText = configTextRaw.trim();

	/** @type {Record<string, unknown>} */
	let config = {};
	if (configText.startsWith("{")) {
		config = JSON.parse(configText);
	} else if (configText.length > 0) {
		for (const item of configText.split(",")) {
			const firstColon = item.indexOf(":");
			if (firstColon === -1) {
				throw new Error("Could not find colon in config option.");
			}
			const key = item.slice(0, firstColon).trim();
			const valueText = item.slice(firstColon + ":".length).trim();

			config[key] = parseConfigValue(valueText);
		}
	}

	const remainingText = fileText.slice(lastIndex + "~~\n".length);
	return { config, remainingText };
}

function parseConfigValue(valueText) {
	// Keep parity with Rust parsing:
	// - try bool ("true"/"false")
	// - then i32
	// - otherwise string as-is
	if (valueText === "true") return true;
	if (valueText === "false") return false;
	if (/^-?\d+$/.test(valueText)) {
		const value = Number.parseInt(valueText, 10);
		// Rust would error on i32 overflow; mirror that loosely.
		if (value < -2147483648 || value > 2147483647) {
			return valueText;
		}
		return value;
	}
	return valueText;
}

function getSpecStarts(fileName, lines) {
	const result = [];
	const messageSeparator = getMessageSeparator(fileName);

	if (!lines[0]?.startsWith(messageSeparator)) {
		throw new Error(
			`All spec files should start with a message. (ex. ${messageSeparator} Message ${messageSeparator})`,
		);
	}

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].startsWith(messageSeparator)) {
			result.push(i);
		}
	}

	return result;
}

function parseSingleSpec(fileName, messageLine, lines, config) {
	const fileText = lines.join("\n");
	const parts = fileText.split("[expect]");

	if (parts.length < 2) {
		throw new Error("Could not find [expect] separator.");
	}

	const inputPart = parts[0];
	const expectedPart = parts[1];

	if (inputPart.length < 1) {
		throw new Error("Input part was unexpectedly empty.");
	}

	const startText = inputPart.slice(0, inputPart.length - "\n".length); // remove last newline
	const expectedText = expectedPart.slice("\n".length); // remove first newline

	const lowerCaseMessageLine = messageLine.toLowerCase();
	const messageSeparator = getMessageSeparator(fileName);
	const isTrace = lowerCaseMessageLine.includes("(trace)");

	return {
		fileName,
		message: messageLine.slice(messageSeparator.length, messageLine.length - messageSeparator.length).trim(),
		fileText: startText,
		expectedText,
		isOnly: lowerCaseMessageLine.includes("(only)") || isTrace,
		isTrace,
		skip: lowerCaseMessageLine.includes("(skip)"),
		skipFormatTwice: lowerCaseMessageLine.includes("(skip-format-twice)"),
		config: { ...config },
	};
}

function getMessageSeparator(fileName) {
	return fileName.endsWith(".md") ? "!!" : "==";
}
