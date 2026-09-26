// @ts-check

const encoder = new TextEncoder();

/** @type {import("@wasm-fmt/runtime").FormatterAdapter<typeof import("./markdown.d.ts")>} */
const adapter = {
	create(wasm, host) {
		const runtime = host.createRuntime(wasm, { encodeConfig });

		/** @type {typeof import("./markdown.d.ts")} */
		const api = {
			format(source, config, options = {}) {
				return runtime.invoke("format", source, { config, onFormatEmbedded: options.onFormatEmbedded });
			},
			createConfig(config) {
				return /** @type {import("./markdown.d.ts").ConfigHandle} */ (runtime.createConfig(config ?? {}));
			},
			releaseConfig(handle) {
				return runtime.releaseConfig(handle);
			},
		};

		return api;
	},
};

export default adapter;

/**
 * @param {unknown} config
 * @returns {Uint8Array}
 */
function encodeConfig(config) {
	if (typeof config === "string") return encoder.encode(config);
	const json = JSON.stringify(config);
	if (json === undefined) throw new TypeError("config must be JSON serializable");
	return encoder.encode(json);
}
