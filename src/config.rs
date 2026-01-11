use dprint_core::configuration::{
    ConfigKeyMap, ConfigurationDiagnostic, GlobalConfiguration, NewLineKind,
    ParseConfigurationError, ResolveConfigurationResult, get_nullable_value,
};
use dprint_plugin_markdown::configuration::{
    Configuration, ConfigurationBuilder, resolve_config as resolve_markdown_config,
};
use wasm_bindgen::prelude::*;

#[derive(Clone, Copy)]
enum LayoutIndentStyle {
    Tab,
    Space,
}

impl std::str::FromStr for LayoutIndentStyle {
    type Err = ParseConfigurationError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "tab" | "tabs" | "\t" => Ok(LayoutIndentStyle::Tab),
            "space" | "spaces" | " " => Ok(LayoutIndentStyle::Space),
            _ => Err(ParseConfigurationError(s.to_string())),
        }
    }
}

impl LayoutIndentStyle {
    fn use_tabs(self) -> bool {
        matches!(self, LayoutIndentStyle::Tab)
    }
}

#[derive(Clone, Copy)]
enum LayoutLineEnding {
    Lf,
    Crlf,
}

impl std::str::FromStr for LayoutLineEnding {
    type Err = ParseConfigurationError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "lf" | "\n" => Ok(LayoutLineEnding::Lf),
            "crlf" | "\r\n" => Ok(LayoutLineEnding::Crlf),
            _ => Err(ParseConfigurationError(s.to_string())),
        }
    }
}

impl LayoutLineEnding {
    fn to_new_line_kind(self) -> NewLineKind {
        match self {
            LayoutLineEnding::Lf => NewLineKind::LineFeed,
            LayoutLineEnding::Crlf => NewLineKind::CarriageReturnLineFeed,
        }
    }
}

fn resolve_layout_global_config(
    config: &mut ConfigKeyMap,
) -> ResolveConfigurationResult<GlobalConfiguration> {
    let mut diagnostics = Vec::new();

    let indent_style =
        get_nullable_value::<LayoutIndentStyle>(config, "indentStyle", &mut diagnostics);
    let use_tabs = get_nullable_value::<bool>(config, "useTabs", &mut diagnostics);

    let indent_width = get_nullable_value::<u8>(config, "indentWidth", &mut diagnostics);
    let line_width = get_nullable_value::<u32>(config, "lineWidth", &mut diagnostics);

    let line_ending =
        get_nullable_value::<LayoutLineEnding>(config, "lineEnding", &mut diagnostics);
    let new_line_kind = get_nullable_value::<NewLineKind>(config, "newLineKind", &mut diagnostics);

    ResolveConfigurationResult {
        config: GlobalConfiguration {
            line_width,
            use_tabs: indent_style.map(|s| s.use_tabs()).or(use_tabs),
            indent_width,
            new_line_kind: line_ending.map(|le| le.to_new_line_kind()).or(new_line_kind),
        },
        diagnostics,
    }
}

pub(crate) fn resolve_wasm_config(config: Option<JsValue>) -> Result<Configuration, String> {
    let Some(settings) = config else {
        return Ok(ConfigurationBuilder::new().build());
    };

    let mut config_map: ConfigKeyMap =
        serde_wasm_bindgen::from_value(settings).map_err(|e| e.to_string())?;

    let global_config_result = resolve_layout_global_config(&mut config_map);
    let resolved_config = resolve_markdown_config(config_map, &global_config_result.config);

    let errors: Vec<ConfigurationDiagnostic> =
        global_config_result.diagnostics.into_iter().chain(resolved_config.diagnostics).collect();

    if !errors.is_empty() {
        return Err(errors.into_iter().map(|d| d.to_string()).collect::<Vec<_>>().join("\n"));
    }

    Ok(resolved_config.config)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_layout_global_config_and_resolve_markdown_config() {
        use dprint_core::configuration::ConfigKeyValue;
        use dprint_plugin_markdown::configuration::TextWrap;

        let mut config_map = ConfigKeyMap::new();
        config_map.insert("indentStyle".to_string(), ConfigKeyValue::from("tab"));
        config_map.insert("indentWidth".to_string(), ConfigKeyValue::from(4));
        config_map.insert("lineWidth".to_string(), ConfigKeyValue::from(100));
        config_map.insert("lineEnding".to_string(), ConfigKeyValue::from("crlf"));
        config_map.insert("textWrap".to_string(), ConfigKeyValue::from("never"));

        let global_config_result = resolve_layout_global_config(&mut config_map);
        assert!(global_config_result.diagnostics.is_empty());
        assert_eq!(global_config_result.config.use_tabs, Some(true));
        assert_eq!(global_config_result.config.indent_width, Some(4));
        assert_eq!(global_config_result.config.line_width, Some(100));
        assert_eq!(
            global_config_result.config.new_line_kind,
            Some(NewLineKind::CarriageReturnLineFeed)
        );

        // Ensure we stripped layout fields from the markdown plugin config map.
        assert!(!config_map.contains_key("indentStyle"));
        assert!(!config_map.contains_key("indentWidth"));
        assert!(!config_map.contains_key("lineWidth"));
        assert!(!config_map.contains_key("lineEnding"));

        let config_result = resolve_markdown_config(config_map, &global_config_result.config);
        assert!(config_result.diagnostics.is_empty());
        assert_eq!(config_result.config.line_width, 100);
        assert_eq!(config_result.config.new_line_kind, NewLineKind::CarriageReturnLineFeed);
        assert!(matches!(config_result.config.text_wrap, TextWrap::Never));
    }
}
