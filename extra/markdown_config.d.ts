/**
 *  See {@link https://dprint.dev/plugins/markdown/config/}
 */
export interface Config {
	/**
	 * The maximum line width.
	 * @default 80
	 */
	lineWidth?: number;
	/**
	 * The kind of new line to use.
	 * @default "lf"
	 */
	newLineKind?: "lf" | "crlf";
	/**
	 * The kind of text wrapping to use.
	 * @default "maintain"
	 */
	textWrap?: "always" | "maintain" | "never";
	/**
	 * The character to use for emphasis/italics.
	 * @default "underscores"
	 */
	emphasisKind?: "asterisks" | "underscores";
	/**
	 * The character to use for strong emphasis/bold.
	 * @default "asterisks"
	 */
	strongKind?: "asterisks" | "underscores";
	/**
	 * The character to use primarily for lists.
	 *
	 * Unnumbered lists will be formatted to use a common list character, i.e., the primary list
	 * character. Additionally, an alternate list character is used to separate lists which are not
	 * separated by other paragraphs. This parameter defines which character should be used as primary
	 * list character, i.e., either '-' (default) or '*'. The alternate list character will be the one
	 * which is _not_ primary.
	 * @default "dashes"
	 */
	unorderedListKind?: "dashes" | "asterisks";

	/**
	 *  See {@link https://dprint.dev/plugins/markdown/config/}
	 */
	[key: string]: unknown;
}
