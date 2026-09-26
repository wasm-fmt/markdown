/** WASM formatter for Markdown using dprint. */

import type { ConfigHandle as BridgeConfigHandle } from "@wasm-fmt/runtime";
import type { Config } from "./markdown_config.d.ts";
export type * from "./markdown_config.d.ts";

export type ConfigHandle = BridgeConfigHandle<"markdown">;
export type ConfigInput = Config | ConfigHandle;

export interface FormatOptions {
	readonly onFormatEmbedded?: import("@wasm-fmt/runtime").EmbeddedFormatter;
}
export declare function format(source: string, config?: ConfigInput, options?: FormatOptions): string;
export declare function createConfig(config?: Config): ConfigHandle;
export declare function releaseConfig(handle: ConfigHandle): void;
