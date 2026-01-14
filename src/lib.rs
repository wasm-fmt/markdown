mod config;

use crate::config::resolve_wasm_config;
use dprint_plugin_markdown::{configuration::Configuration, format_text};
use js_sys::Function;
use std::cell::RefCell;
use wasm_bindgen::prelude::*;

thread_local! {
    static FORMAT_CODE_BLOCK: RefCell<Option<Function>> = const { RefCell::new(None) };
}

#[wasm_bindgen(typescript_custom_section)]
const FORMAT_CODE_BLOCK_TYPES: &'static str = r#"
interface FormatCodeBlock {
	/**
	 * @param {string} tag - the tag/info string of the code block/fence
	 * @param {string} text - the text content of the code block/fence
	 * @param {number} lineWidth - the maximum line width to format to
	 * @returns {string | null | undefined} - the formatted text content, or null/undefined to keep as-is
	 */
	(tag: string, text: string, lineWidth: number): string | null | undefined;
}
"#;

/// Sets a function to format code blocks within markdown.
#[wasm_bindgen]
pub fn set_format_code_block(
    #[wasm_bindgen(unchecked_param_type = "FormatCodeBlock | null | undefined")]
    #[wasm_bindgen(
        param_description = "A JS function (tag, text, lineWidth) => formatted text, or null/undefined to keep original.\nPass null to clear."
    )]
    formatter: Option<Function>,
) {
    FORMAT_CODE_BLOCK.with(|slot| {
        *slot.borrow_mut() = formatter;
    });
}

fn format_code_block_text(
    tag: &str,
    text: &str,
    line_width: u32,
) -> anyhow::Result<Option<String>> {
    let formatter = FORMAT_CODE_BLOCK.with(|slot| slot.borrow().clone());
    let Some(formatter) = formatter else {
        return Ok(None);
    };

    let result = formatter
        .call3(
            &JsValue::NULL,
            &JsValue::from_str(tag),
            &JsValue::from_str(text),
            &JsValue::from_f64(line_width as f64),
        )
        .map_err(|e| anyhow::anyhow!("FORMAT_CODE_BLOCK threw: {:?}", e))?;

    if result.is_null() || result.is_undefined() {
        Ok(None)
    } else if let Some(result) = result.as_string() {
        Ok(Some(result))
    } else {
        Err(anyhow::anyhow!("FORMAT_CODE_BLOCK must return a string or null/undefined"))
    }
}

#[wasm_bindgen(typescript_custom_section)]
const CONFIG_TYPES: &str = r#"
import type { Config } from "./markdown_config.d.ts";
export type * from "./markdown_config.d.ts";
"#;
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = "Config")]
    pub type Config;
}

/// Formats the given markdown code with the provided Configuration.
#[wasm_bindgen]
pub fn format(
    #[wasm_bindgen(param_description = "The markdown code to format")] code: &str,
    #[wasm_bindgen(param_description = "Optional formatter config")] config: Option<Config>,
) -> Result<Option<String>, String> {
    let config = resolve_wasm_config(config.map(Into::into))?;

    format_internal(code, config)
}

pub fn format_internal(code: &str, config: Configuration) -> Result<Option<String>, String> {
    format_text(code, &config, format_code_block_text).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use dprint_plugin_markdown::configuration::ConfigurationBuilder;

    #[test]
    fn test_format_basic() {
        let code = "#  Hello World  ";
        let result = format_internal(code, ConfigurationBuilder::new().build());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), Some("# Hello World\n".to_string()));
    }

    #[test]
    fn test_format_with_extra_newlines() {
        let code = "# Hello\n\n\n\n";
        let result = format_internal(code, ConfigurationBuilder::new().build());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), Some("# Hello\n".to_string()));
    }
}
