mod config;

use crate::config::MarkdownConfig;
use dprint_plugin_markdown::{configuration::Configuration, format_text};

#[bridge::formatter]
fn format(
    source: &str,
    config: &MarkdownConfig,
    host: &bridge::Host<'_>,
) -> Result<String, String> {
    let formatted =
        format_with_embedded(source, config.resolved(), |request| host.format_embedded(request))?;
    Ok(formatted.unwrap_or_else(|| source.to_owned()))
}

pub fn format_internal(code: &str, config: &Configuration) -> Result<Option<String>, String> {
    format_with_embedded(code, config, |_| Ok(None))
}

pub fn format_with_embedded(
    code: &str,
    config: &Configuration,
    mut format_embedded: impl FnMut(bridge::EmbeddedRequest<'_>) -> Result<Option<String>, String>,
) -> Result<Option<String>, String> {
    let mut first_error = None;
    let formatted = format_text(code, config, |tag, source, line_width| {
        if first_error.is_some() {
            return Ok(None);
        }
        let Some(extension) = tag_extension(tag, config) else {
            return Ok(None);
        };
        let filename = format!("embedded.{extension}");
        let request = bridge::EmbeddedRequest {
            source,
            filename: &filename,
            line_width: std::num::NonZeroU32::new(line_width),
        };
        match format_embedded(request) {
            Ok(result) => Ok(result),
            Err(error) => {
                first_error = Some(error);
                Ok(None)
            }
        }
    });
    if let Some(error) = first_error {
        return Err(error);
    }
    formatted.map_err(|error| error.to_string())
}

fn tag_extension<'a>(tag: &str, config: &'a Configuration) -> Option<&'a str> {
    let tag = tag.trim().to_lowercase();
    if let Some(extension) = config.tags.get(&tag) {
        return Some(extension);
    }
    Some(match tag.as_str() {
        "python" | "py" => "py",
        "go" | "golang" => "go",
        "php" => "php",
        "typescript" | "ts" => "ts",
        "javascript" | "js" => "js",
        "rust" | "rs" => "rs",
        "shell" | "sh" | "bash" => "sh",
        "yml" | "yaml" => "yaml",
        "csharp" | "cs" => "cs",
        "visualbasic" | "vb" => "vb",
        "tsx" => "tsx",
        "jsx" => "jsx",
        "json" => "json",
        "jsonc" => "jsonc",
        "html" => "html",
        "css" => "css",
        "less" => "less",
        "scss" => "scss",
        "toml" => "toml",
        "svelte" => "svelte",
        "vue" => "vue",
        "astro" => "astro",
        "xml" => "xml",
        "graphql" => "graphql",
        "dockerfile" => "dockerfile",
        "cue" => "cue",
        "lua" => "lua",
        "sql" => "sql",
        "wgsl" => "wgsl",
        _ => return None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use dprint_plugin_markdown::configuration::ConfigurationBuilder;

    #[test]
    fn test_format_basic() {
        let code = "#  Hello World  ";
        let config = ConfigurationBuilder::new().build();
        let result = format_internal(code, &config);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), Some("# Hello World\n".to_string()));
    }

    #[test]
    fn test_format_with_extra_newlines() {
        let code = "# Hello\n\n\n\n";
        let config = ConfigurationBuilder::new().build();
        let result = format_internal(code, &config);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), Some("# Hello\n".to_string()));
    }
}
