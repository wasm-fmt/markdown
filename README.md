[![Test](https://github.com/wasm-fmt/markdown/actions/workflows/test.yml/badge.svg)](https://github.com/wasm-fmt/markdown/actions/workflows/test.yml)

# Install

[![npm](https://img.shields.io/npm/v/@wasm-fmt/markdown)](https://www.npmjs.com/package/@wasm-fmt/markdown)

```bash
npm install @wasm-fmt/markdown
```

[![jsr.io](https://jsr.io/badges/@fmt/markdown)](https://jsr.io/@fmt/markdown)

```bash
npx jsr add @fmt/markdown
```

# Usage

## Node.js / Deno / Bun / Bundler

```javascript
import { format } from "@wasm-fmt/markdown";

const input = `#  Hello wasm-fmt

1. markdown
2. clang-format
2. gofmt
2. ruff_fmt
`;

const formatted = format(input, {
	// config
});
console.log(formatted);
```

## Web

For web environments, you need to initialize WASM module manually:

```javascript
import init, { format } from "@wasm-fmt/markdown/web";

await init();

const input = `#  Hello wasm-fmt

1. markdown
2. clang-format
2. gofmt
2. ruff_fmt
`;

const formatted = format(input);
console.log(formatted);
```

## Embedded code blocks

The Bridge experiment formats Markdown itself, but does not expose the previous synchronous
`set_format_code_block` JavaScript callback. Host callbacks are outside the current Bridge ABI.
Code blocks are therefore preserved unless the Markdown formatter can handle them without a host
callback. A host-neutral embedded-formatting design will be considered separately.

### Vite

```JavaScript
import init, { format } from "@wasm-fmt/markdown/vite";

await init();
// ...
```

Or use the `./bundler` entry with [vite-plugin-wasm](https://www.npmjs.com/package/vite-plugin-wasm)

```javascript
import { format } from "@wasm-fmt/markdown/bundler";
```

## Entry Points

- `.` - Auto-detects environment (Node.js uses node, Webpack uses bundler, default is ESM)
- `./node` - Node.js environment (no init required)
- `./esm` - ESM environments like Deno (no init required)
- `./bundler` - Bundlers like Webpack (no init required)
- `./web` - Web browsers (requires manual init)
- `./vite` - Vite bundler (requires manual init)

# Credits

Thanks to:

- The [dprint-plugin-markdown](https://github.com/dprint/dprint-plugin-markdown) project

### Embedded languages

Bridge v1 can ask the host to format code fences and YAML front matter. Pass
`{ onFormatEmbedded }` as the third argument to `format`, or register Markdown
in `createFormatterContext()` from `@wasm-fmt/runtime`. The callback receives
`{ source, filename, lineWidth? }` and synchronously returns replacement text,
undefined to skip, or throws. Virtual filenames such as `embedded.py` and
`embedded.go` identify the target language; custom `tags` config mappings are
respected. Target formatters must already be initialized.

An unavailable language is left without an external replacement. A callback
failure fails the whole format call, including front matter; the instance can
be used again afterward. The callback is separate from formatter configuration
and registered config handles. Bundler and ESM entries use `import source` to
instantiate the host-enabled Wasm; use Web/Vite entries if the toolchain does
not support source-phase Wasm imports.
