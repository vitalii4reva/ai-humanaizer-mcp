# AI Humanaizer

Two local MCP servers that rewrite AI-generated text to sound naturally human.

- **en-humanizer**: English text humanization using qwen3:30b model
- **uk-humanizer**: Ukrainian text humanization using gemma3:27b model

All processing happens locally via Ollama. No cloud APIs, no data sent externally. Complete privacy.

## Prerequisites

- **Node.js** v18 or higher
- **Ollama** running locally ([download here](https://ollama.ai))
- **Required models**:
  ```bash
  ollama pull qwen3:30b
  ollama pull gemma3:27b
  ```

## Installation

```bash
git clone <repo-url>
cd ai-humanaizer
npm install
npm run build
```

## Available Tools

Both servers (en-humanizer and uk-humanizer) provide the same 4 tools:

| Tool | Description | Parameters |
|------|-------------|------------|
| `humanize_text` | Rewrite AI text to sound human | `text` (required), `style` (optional: casual, professional, academic, blog, journalistic) |
| `detect_ai_patterns` | Analyze text for AI writing patterns | `text` (required) |
| `compare_versions` | Humanize text and show side-by-side comparison | `text` (required), `style` (optional) |
| `score_humanness` | Rate text 0-100 on humanness | `text` (required) |

**Style parameter**: If not specified, the tool will automatically detect the writing style from the input text.

## Editor Setup

### Claude Code

Configuration location: project-level `.claude/settings.json` (recommended) or global `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

**Note**: Paths are relative to project root. If using global config, replace with absolute paths.

### Zed

Configuration location: `~/.config/zed/settings.json`

Merge this into your existing settings:

```json
{
  "context_servers": {
    "en-humanizer": {
      "command": {
        "path": "node",
        "args": ["packages/en-humanizer/dist/index.js"]
      }
    },
    "uk-humanizer": {
      "command": {
        "path": "node",
        "args": ["packages/uk-humanizer/dist/index.js"]
      }
    }
  }
}
```

**Note**: Paths are relative to where Zed opens the project.

### Windsurf

Configuration location: `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

**Note**: Paths are relative to project root. Use absolute paths if needed.

## Usage Examples

Once configured, you can use the tools in any supported editor:

**Humanize AI-generated text:**
```
Humanize this text: [paste your AI-generated text here]
```

**Detect AI patterns:**
```
Detect AI patterns in: [paste text to analyze]
```

**Score text for humanness:**
```
Score this text for humanness: [paste text to evaluate]
```

**Compare versions:**
```
Compare versions of: [paste text to humanize and compare]
```

## Project Structure

```
packages/
  shared/          # Common utilities (Ollama client, prompt loader, types)
  en-humanizer/    # English MCP server (qwen3:30b)
  uk-humanizer/    # Ukrainian MCP server (gemma3:27b)
prompts/
  en/              # English prompt templates
  uk/              # Ukrainian prompt templates
configs/           # Example editor configurations
```

## Development

Build commands:

```bash
npm run build        # Build all packages
npm run build:en     # Build EN humanizer only
npm run build:uk     # Build UK humanizer only
```

**Prompt hot-reload**: Prompt templates are loaded at tool invocation time. You can modify prompts without rebuilding the TypeScript packages.
