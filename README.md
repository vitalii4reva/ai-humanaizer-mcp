# AI Humanaizer

Two local MCP servers that rewrite AI-generated text to sound naturally human. Works with any MCP-compatible editor.

**en-humanizer** -- English | **uk-humanizer** -- Ukrainian

All processing runs locally via [Ollama](https://ollama.ai) + gemma3:27b. No cloud APIs. No data leaves your machine.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Tools](#tools)
- [Writing Styles](#writing-styles)
- [Editor Setup](#editor-setup)
  - [Claude Code](#claude-code)
  - [Claude Desktop](#claude-desktop)
  - [Cursor](#cursor)
  - [Zed](#zed)
  - [Windsurf](#windsurf)
- [Usage Examples](#usage-examples)
- [Multi-pass Humanization](#multi-pass-humanization)
- [AI Detection Results](#ai-detection-results)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)

---

## Prerequisites

- **Node.js** v18+
- **Ollama** running locally -- [download](https://ollama.ai)
- Pull the model:
  ```bash
  ollama pull gemma3:27b
  ```

## Installation

```bash
git clone https://github.com/anthropics/ai-humanaizer.git
cd ai-humanaizer
npm install
npm run build
```

---

## Tools

Both servers expose 5 identical tools (with language-specific prompts):

| Tool | What it does | Key params |
|------|-------------|------------|
| **`humanize_text`** | Rewrite AI text to sound human | `text`, `style?`, `passes?` |
| **`detect_ai_patterns`** | Find AI writing patterns with severity levels | `text` |
| **`compare_versions`** | Humanize + show side-by-side diff | `text`, `style?`, `passes?` |
| **`score_humanness`** | Rate 0-100 how human the text sounds | `text` |
| **`humanize_until_human`** | Rewrite iteratively until target score | `text`, `style?`, `min_score?`, `max_iterations?` |

## Writing Styles

| Style | Tone | Best for |
|-------|------|----------|
| `casual` | Friendly, contractions, first-person | Chat replies, social media |
| `professional` | Confident, direct, business-appropriate | Docs, support answers, emails |
| `academic` | Formal, no contractions, hedged claims | Papers, research, reports |
| `blog` | Engaging, "I/we" voice, storytelling | Blog posts, tutorials |
| `journalistic` | Fact-focused, active voice, crisp | News, product descriptions |

If `style` is omitted, it auto-detects from the input text.

---

## Editor Setup

### Claude Code

Add to `.claude/settings.json` in project root (or `~/.claude/settings.json` globally):

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/ai-humanaizer/packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

Or with relative paths if the config is inside the project:

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

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/ai-humanaizer/packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop after saving. The tools appear automatically in the conversation.

### Cursor

Add to `.cursor/mcp.json` in project root (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/ai-humanaizer/packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

### Zed

Merge into `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "en-humanizer": {
      "command": {
        "path": "node",
        "args": ["/absolute/path/to/ai-humanaizer/packages/en-humanizer/dist/index.js"]
      }
    },
    "uk-humanizer": {
      "command": {
        "path": "node",
        "args": ["/absolute/path/to/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
      }
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/ai-humanaizer/packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["/absolute/path/to/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

---

## Usage Examples

### Humanize text

Ask your AI assistant:

> Humanize this professional text: "The platform leverages comprehensive monitoring capabilities to facilitate seamless tracking of key performance indicators. Additionally, it provides real-time alerts and automated reporting."

Result:

> The platform tracks key performance indicators in real time without manual configuration. Alerts and reports run automatically -- no setup needed after the initial deployment.

### Humanize with style

> Humanize as casual: "Videolyti offers free AI transcription with every download. Simply enable the transcription option when downloading."

Result:

> Free transcription with every download -- I didn't see that coming. Toggle the option before you hit save and Whisper does the rest.

### Multi-pass for instructional content

> Humanize this with 2 passes, professional style: "First, go to your account settings page. Then, click on the Security tab. Next, select Enable 2FA."

Two passes break structural patterns that single-pass leaves behind. See [Multi-pass Humanization](#multi-pass-humanization).

### Detect AI patterns

> Detect AI patterns in: "Furthermore, implementing comprehensive solutions is crucial for organizations seeking to leverage cutting-edge technologies in today's rapidly evolving digital landscape."

Returns a structured report:
- Patterns found (with severity: high/medium/low)
- AI score (0-100%)
- Specific improvement suggestions

### Score humanness

> Score this text: "Most companies just need tools that actually work -- fancy AI integrations sound great in a pitch deck but three teams I've talked to rolled them back within six months."

Returns:
- Score: 92/100
- Findings: strong personal voice (+5), specific detail "three teams" (+3), casual connector "but" (+2)

### Compare versions

> Compare versions: "The system utilizes robust monitoring capabilities to facilitate seamless tracking."

Returns original and humanized text side by side with a list of every change made.

### Humanize until human

> Humanize until human (min score 90): "The platform offers a seamless user experience, robust analytics, and comprehensive reporting capabilities."

Runs up to 5 iterations, scoring after each. Stops when the target is reached or score plateaus.

---

## Multi-pass Humanization

The `passes` parameter (1-3) runs the text through humanization multiple times. Each pass sees different text and makes different choices, breaking patterns the previous pass left.

| Passes | Best for | Speed |
|--------|----------|-------|
| 1 (default) | Most text | ~5-10s |
| 2 | How-to guides, instructional content, FAQs | ~10-20s |
| 3 | Extremely uniform or technical input | ~15-30s |

ZeroGPT detection comparison on the same 6-sentence how-to text:

| Passes | AI Detection |
|--------|-------------|
| 1 pass | 0-60% (varies) |
| 2 passes | 0-30% (consistently lower) |

---

## AI Detection Results

Tested with [ZeroGPT](https://zerogpt.com) API across 3 runs (12 EN tests + 7 UK tests):

| Category | ZeroGPT Score |
|----------|--------------|
| EN Casual | 0% (stable) |
| EN Blog | 0% (stable) |
| EN Journalistic | 0% (stable) |
| EN Professional | 0-40% (varies by content) |
| EN Professional 2-pass | 0-30% (lower) |
| EN Academic | 0% (stable) |
| **UK all styles** | **0% (stable)** |

Short texts (2-3 sentences) pass consistently. Longer instructional/how-to texts benefit from 2-pass.

---

## Project Structure

```
ai-humanaizer/
  packages/
    shared/            # OllamaClient, TextProcessor, PromptLoader, types
    en-humanizer/      # English MCP server
    uk-humanizer/      # Ukrainian MCP server
  prompts/
    en/                # English prompt templates (system, detect, score)
    uk/                # Ukrainian prompt templates
  configs/             # Example editor configurations
  test-humanize.mjs    # Test script with ZeroGPT integration
```

## Development

```bash
npm run build          # Build all packages
npm run build:shared   # Build shared utilities only
npm run build:en       # Build EN humanizer only
npm run build:uk       # Build UK humanizer only
```

**Prompt hot-reload**: Prompt templates in `prompts/` are watched by chokidar. Edit them without rebuilding -- changes apply on next tool call.

## Testing

```bash
node test-humanize.mjs en           # EN tests only
node test-humanize.mjs uk           # UK tests only
node test-humanize.mjs all          # Both
node test-humanize.mjs en --zerogpt # EN + ZeroGPT AI detection scoring
node test-humanize.mjs all --zerogpt # All + ZeroGPT
```

The test script sends text to Ollama, applies post-processing, checks for AI cliches/patterns, and optionally scores each output via ZeroGPT API.

---

# AI Humanaizer (UA)

Два локальних MCP-сервери, що переписують AI-текст так, щоб він звучав природно.

**en-humanizer** -- англійська | **uk-humanizer** -- українська

Все працює локально через [Ollama](https://ollama.ai) + gemma3:27b. Жодних хмарних API. Дані не покидають вашу машину.

---

## Вимоги

- **Node.js** v18+
- **Ollama** локально -- [завантажити](https://ollama.ai)
- Завантажити модель:
  ```bash
  ollama pull gemma3:27b
  ```

## Встановлення

```bash
git clone https://github.com/anthropics/ai-humanaizer.git
cd ai-humanaizer
npm install
npm run build
```

---

## Інструменти

Обидва сервери надають 5 однакових інструментів (з мовно-специфічними промптами):

| Інструмент | Що робить | Параметри |
|------------|-----------|-----------|
| **`humanize_text`** | Переписати AI-текст на людський | `text`, `style?`, `passes?` |
| **`detect_ai_patterns`** | Знайти AI-паттерни з рівнями серйозності | `text` |
| **`compare_versions`** | Гуманізувати + показати порівняння | `text`, `style?`, `passes?` |
| **`score_humanness`** | Оцінити 0-100 наскільки текст людський | `text` |
| **`humanize_until_human`** | Переписувати ітеративно до цільового скору | `text`, `style?`, `min_score?`, `max_iterations?` |

## Стилі

| Стиль | Тон | Для чого |
|-------|-----|----------|
| `casual` | Розмовний, скорочення, від першої особи | Чати, соцмережі |
| `professional` | Впевнений, діловий, без сленгу | Документація, листування |
| `academic` | Формальний, без скорочень, обережні твердження | Наукові роботи, звіти |
| `blog` | Захоплюючий, "я/ми", сторітелінг | Блоги, туторіали |
| `journalistic` | Факти, активний стан, стисло | Новини, описи продуктів |

Якщо `style` не вказаний -- визначається автоматично.

---

## Налаштування редакторів

### Claude Code

Додати до `.claude/settings.json` у корені проекту (або `~/.claude/settings.json` глобально):

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

### Claude Desktop

Додати до `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) або `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

Перезапустіть Claude Desktop після збереження. Інструменти з'являться автоматично.

### Cursor

Додати до `.cursor/mcp.json` у корені проекту (або `~/.cursor/mcp.json` глобально):

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

### Zed

Додати до `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "en-humanizer": {
      "command": {
        "path": "node",
        "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/en-humanizer/dist/index.js"]
      }
    },
    "uk-humanizer": {
      "command": {
        "path": "node",
        "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
      }
    }
  }
}
```

### Windsurf

Додати до `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "node",
      "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/en-humanizer/dist/index.js"]
    },
    "uk-humanizer": {
      "command": "node",
      "args": ["/абсолютний/шлях/до/ai-humanaizer/packages/uk-humanizer/dist/index.js"]
    }
  }
}
```

---

## Приклади використання

### Гуманізація тексту

Попросіть AI-асистента:

> Гуманізуй цей текст: "Завантаження відео з TikTok для особистого використання зазвичай дозволяється. Однак повторне завантаження або комерційне використання захищеного авторським правом контенту може порушувати умови обслуговування. Завжди поважайте права авторів."

Результат:

> Звісно, можна завантажити відео з TikTok, якщо ви використовуєте його лише для себе. Але якщо ви вирішите поширювати цей контент чи використовувати його у комерційних цілях -- це може бути порушенням авторських прав, тож будьте обережні. Пам'ятайте, повага до творців -- це запорука гарних відносин у цифровому просторі.

### Гуманізація зі стилем

> Гуманізуй casual: "Videolyti працює лише з публічними акаунтами Instagram. Приватні акаунти потребують авторизації."

Результат:

> Працює лише з відкритими профілями Instagram -- приватні акаунти ми не беремо, бо поважаємо приватність. Ну, знаєте, щоб ніяких сюрпризів, от і все.

### Мульти-прохід для інструкцій

> Гуманізуй з 2 проходами, professional: "Спочатку відкрийте налаштування. Потім перейдіть на вкладку Безпека. Далі увімкніть 2FA."

Два проходи ламають структурні паттерни, що лишаються після одного.

### Виявлення AI-паттернів

> Знайди AI-паттерни в: "Ця платформа є свідченням трансформаційного впливу штучного інтелекту на сучасний цифровий ландшафт."

Повертає структурований звіт:
- Знайдені паттерни (rusyzmy, kancelyaryzmy, AI-лексика)
- AI-скор (0-100%)
- Конкретні рекомендації

### Оцінка людяності

> Оціни текст: "Працює лише з відкритими профілями -- приватні акаунти ми не беремо, бо поважаємо приватність."

Повертає:
- Скор: 95/100
- Знахідки: розмовна частка "бо" (+4), неформальний тон (+3), природна структура (+2)

### Порівняння версій

> Порівняй версії: "Дана платформа забезпечує безперебійний доступ до всеосяжного моніторингу ключових показників."

Повертає оригінал і гуманізований текст поруч зі списком змін.

### Гуманізувати до людського

> Гуманізуй до людського (мін. скор 75): "Ця платформа пропонує комплексне рішення для моніторингу та аналітики."

Запускає до 5 ітерацій, оцінюючи після кожної. Зупиняється при досягненні цілі або плато.

---

## Мульти-прохід

Параметр `passes` (1-3) прогоняє текст через гуманізацію кілька разів. Кожен прохід бачить інший текст і робить інші вибори.

| Проходи | Для чого | Час |
|---------|----------|-----|
| 1 (за замовчуванням) | Більшість текстів | ~5-10с |
| 2 | Інструкції, how-to, FAQ | ~10-20с |
| 3 | Дуже однорідний або технічний текст | ~15-30с |

## Результати AI-детекції

Тестовано через [ZeroGPT](https://zerogpt.com) API (12 EN + 7 UK тестів):

| Категорія | ZeroGPT |
|-----------|---------|
| EN Casual | 0% (стабільно) |
| EN Blog | 0% (стабільно) |
| EN Journalistic | 0% (стабільно) |
| EN Professional | 0-40% (залежить від контенту) |
| EN Professional 2-pass | 0-30% (нижче) |
| **UK всі стилі** | **0% (стабільно)** |

---

## Розробка

```bash
npm run build          # Зібрати все
npm run build:shared   # Тільки shared
npm run build:en       # Тільки EN
npm run build:uk       # Тільки UK
```

**Hot-reload промптів**: Файли в `prompts/` відстежуються chokidar. Зміни застосовуються при наступному виклику інструменту -- без перезбірки.

## Тестування

```bash
node test-humanize.mjs en           # Тільки EN
node test-humanize.mjs uk           # Тільки UK
node test-humanize.mjs all          # Обидві мови
node test-humanize.mjs en --zerogpt # EN + оцінка ZeroGPT
node test-humanize.mjs all --zerogpt # Все + ZeroGPT
```
