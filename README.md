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

const input = `#  Hello World

This is   a test.`;

const formatted = format(input);
console.log(formatted);
```

### Vite

```JavaScript
import init, { format } from "@wasm-fmt/markdown/vite";

await init();
// ...
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
