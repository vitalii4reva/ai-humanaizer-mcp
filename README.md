# AI Humanaizer

[![npm](https://img.shields.io/npm/v/@ai-humanizer/en-humanizer)](https://www.npmjs.com/package/@ai-humanizer/en-humanizer)
[![npm](https://img.shields.io/npm/v/@ai-humanizer/uk-humanizer)](https://www.npmjs.com/package/@ai-humanizer/uk-humanizer)

Two local MCP servers that rewrite AI-generated text to sound naturally human. Works with any MCP-compatible editor.

**en-humanizer** -- English | **uk-humanizer** -- Ukrainian

All processing runs via gemma3:27b. Supports three backends: **Ollama** (local), **OpenRouter**, and **Google AI Studio**.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (npx)](#quick-start-npx)
- [Editor Setup](#editor-setup)
  - [Claude Code](#claude-code)
  - [Claude Desktop](#claude-desktop)
  - [Cursor](#cursor)
  - [Zed](#zed)
  - [Windsurf](#windsurf)
- [Tools](#tools)
- [Writing Styles](#writing-styles)
- [Usage Examples](#usage-examples)
- [Multi-pass Humanization](#multi-pass-humanization)
- [AI Detection Results](#ai-detection-results)
- [LLM Backend](#llm-backend)
- [Installation (from source)](#installation-from-source)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)

---

## Prerequisites

- **Node.js** v18+
- **One of** the following LLM backends:
  - **Ollama** (local) -- [download](https://ollama.ai), then `ollama pull gemma3:27b`
  - **OpenRouter** -- [get API key](https://openrouter.ai/keys)
  - **Google AI Studio** -- [get API key](https://aistudio.google.com/apikey)

## Quick Start (npx)

No cloning, no building -- just paste config into your editor and go.

1. Get an API key from [OpenRouter](https://openrouter.ai/keys), [Google AI Studio](https://aistudio.google.com/apikey), or run [Ollama](https://ollama.ai) locally
2. Add the MCP server config to your editor (see [Editor Setup](#editor-setup) below)
3. Ask your AI assistant: *"Humanize this text: ..."*

---

## Editor Setup

### Claude Code

Run this command to add the server directly:

```bash
claude mcp add en-humanizer -- npx -y @ai-humanizer/en-humanizer
```

Then set the required env vars in `~/.claude/settings.json` or `.claude/settings.json`:

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/en-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    }
  }
}
```

For Ukrainian, add a second server:

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/en-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    },
    "uk-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/uk-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    }
  }
}
```

Restart Claude Code (`/mcp` to verify servers are connected). The 5 tools appear automatically.

### Claude Desktop

Open settings: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows).

Add:

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/en-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    },
    "uk-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/uk-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    }
  }
}
```

Restart Claude Desktop. The tools appear in the conversation toolbar (hammer icon).

### Cursor

Add to `.cursor/mcp.json` in project root (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/en-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    },
    "uk-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/uk-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
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
        "path": "npx",
        "args": ["-y", "@ai-humanizer/en-humanizer"],
        "env": {
          "LLM_BACKEND": "openrouter",
          "OPENROUTER_API_KEY": "sk-or-v1-..."
        }
      }
    },
    "uk-humanizer": {
      "command": {
        "path": "npx",
        "args": ["-y", "@ai-humanizer/uk-humanizer"],
        "env": {
          "LLM_BACKEND": "openrouter",
          "OPENROUTER_API_KEY": "sk-or-v1-..."
        }
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
      "command": "npx",
      "args": ["-y", "@ai-humanizer/en-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    },
    "uk-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/uk-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    }
  }
}
```

### Using a different LLM backend

Replace the `env` block in any config above. See [LLM Backend](#llm-backend) for all options.

**Google AI Studio** (free tier):
```json
"env": {
  "LLM_BACKEND": "google",
  "GOOGLE_AI_API_KEY": "AI..."
}
```

**Ollama** (local, needs GPU):
```json
"env": {
  "LLM_BACKEND": "ollama"
}
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

Tested with [ZeroGPT](https://zerogpt.com) API (12 EN tests + 7 UK tests):

| Category | ZeroGPT Score |
|----------|--------------|
| EN Casual | 0% (stable) |
| EN Blog | 0% (stable) |
| EN Journalistic | 0% (stable) |
| EN Professional | 0-24% (short FAQ 0%, long how-to ~24%) |
| EN Professional 2-pass | 0% (stable) |
| EN Academic | 0% (stable) |
| **UK all styles** | **0% (stable)** |

Short texts (2-3 sentences) pass consistently. Longer instructional/how-to texts benefit from 2-pass.

---

## LLM Backend

Three backends available. Pass the env vars via the `env` block in your MCP config (see [Editor Setup](#editor-setup)), or via `.env.local` when running from source.

| Backend | Env vars | Notes |
|---------|----------|-------|
| **OpenRouter** (recommended) | `LLM_BACKEND=openrouter` `OPENROUTER_API_KEY=sk-or-...` | Fast, no local GPU. Optional: `OPENROUTER_MODEL` (default: `google/gemma-3-27b-it`) |
| **Google AI Studio** | `LLM_BACKEND=google` `GOOGLE_AI_API_KEY=AI...` | Free tier, ~15 RPM. Optional: `GOOGLE_AI_MODEL` |
| **Ollama** | `LLM_BACKEND=ollama` | Local, needs GPU. `ollama pull gemma3:27b` first. Optional: `OLLAMA_HOST`, `OLLAMA_MODEL` |

Without `LLM_BACKEND`, the system auto-detects by checking which API key is set (OpenRouter > Google > Ollama fallback).

---

## Installation (from source)

```bash
git clone https://github.com/vitalii4reva/ai-humanaizer-mcp.git
cd ai-humanaizer
npm install
npm run build
```

When running from source, create `.env.local` in the project root with your backend config (see table above), or pass env vars in your MCP config.

<details>
<summary>Editor config with local paths (from source)</summary>

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

</details>

## Project Structure

```
ai-humanaizer/
  packages/
    shared/            # LLMClient, LLMFactory, TextProcessor, PromptLoader, types
    en-humanizer/      # English MCP server
    uk-humanizer/      # Ukrainian MCP server
  prompts/
    en/                # English prompt templates (system, detect, score)
    uk/                # Ukrainian prompt templates
  configs/             # Example editor configurations
  test-humanize.mjs    # Test script with ZeroGPT integration
  .env.local           # LLM backend config (not committed)
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

The test script sends text to the configured LLM backend, applies post-processing, checks for AI cliches/patterns, and optionally scores each output via ZeroGPT API.

---

# AI Humanaizer (UA)

Два локальних MCP-сервери, що переписують AI-текст так, щоб він звучав природно.

**en-humanizer** -- англійська | **uk-humanizer** -- українська

Все працює через gemma3:27b. Три бекенди: **Ollama** (локально), **OpenRouter**, **Google AI Studio**.

---

## Вимоги

- **Node.js** v18+
- **Один з** LLM-бекендів:
  - **Ollama** (локально) -- [завантажити](https://ollama.ai), потім `ollama pull gemma3:27b`
  - **OpenRouter** -- [отримати API ключ](https://openrouter.ai/keys)
  - **Google AI Studio** -- [отримати API ключ](https://aistudio.google.com/apikey)

## Швидкий старт (npx)

Без клонування, без збірки -- просто вставте конфіг у редактор.

1. Отримайте API-ключ: [OpenRouter](https://openrouter.ai/keys), [Google AI Studio](https://aistudio.google.com/apikey), або запустіть [Ollama](https://ollama.ai) локально
2. Додайте MCP-конфіг у свій редактор (див. [Налаштування редакторів](#налаштування-редакторів))
3. Попросіть AI-асистента: *"Гуманізуй цей текст: ..."*

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

Додайте сервер командою:

```bash
claude mcp add en-humanizer -- npx -y @ai-humanizer/en-humanizer
```

Або вручну в `~/.claude/settings.json` (глобально) чи `.claude/settings.json` (проект):

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/en-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    },
    "uk-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/uk-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    }
  }
}
```

Перезапустіть Claude Code (`/mcp` щоб перевірити підключення). 5 інструментів з'являться автоматично.

### Claude Desktop

Відкрийте: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) або `%APPDATA%\Claude\claude_desktop_config.json` (Windows).

Додайте:

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/en-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    },
    "uk-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/uk-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    }
  }
}
```

Перезапустіть Claude Desktop. Інструменти з'являться на панелі (іконка молотка).

### Cursor

Додати до `.cursor/mcp.json` у корені проекту (або `~/.cursor/mcp.json` глобально):

```json
{
  "mcpServers": {
    "en-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/en-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    },
    "uk-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/uk-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
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
        "path": "npx",
        "args": ["-y", "@ai-humanizer/en-humanizer"],
        "env": {
          "LLM_BACKEND": "openrouter",
          "OPENROUTER_API_KEY": "sk-or-v1-..."
        }
      }
    },
    "uk-humanizer": {
      "command": {
        "path": "npx",
        "args": ["-y", "@ai-humanizer/uk-humanizer"],
        "env": {
          "LLM_BACKEND": "openrouter",
          "OPENROUTER_API_KEY": "sk-or-v1-..."
        }
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
      "command": "npx",
      "args": ["-y", "@ai-humanizer/en-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    },
    "uk-humanizer": {
      "command": "npx",
      "args": ["-y", "@ai-humanizer/uk-humanizer"],
      "env": {
        "LLM_BACKEND": "openrouter",
        "OPENROUTER_API_KEY": "sk-or-v1-..."
      }
    }
  }
}
```

### Інший LLM-бекенд

Замініть блок `env` в будь-якому конфігу вище. Див. [LLM-бекенд](#llm-бекенд) для всіх варіантів.

**Google AI Studio** (безкоштовний):
```json
"env": {
  "LLM_BACKEND": "google",
  "GOOGLE_AI_API_KEY": "AI..."
}
```

**Ollama** (локально, потрібен GPU):
```json
"env": {
  "LLM_BACKEND": "ollama"
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
| EN Professional | 0-24% (FAQ 0%, how-to ~24%) |
| EN Professional 2-pass | 0% (стабільно) |
| EN Academic | 0% (стабільно) |
| **UK всі стилі** | **0% (стабільно)** |

---

## LLM-бекенд

Три бекенди. Передайте змінні через блок `env` у MCP-конфігу (див. [Налаштування редакторів](#налаштування-редакторів)), або через `.env.local` при роботі з вихідним кодом.

| Бекенд | Змінні | Примітки |
|--------|--------|----------|
| **OpenRouter** (рекомендовано) | `LLM_BACKEND=openrouter` `OPENROUTER_API_KEY=sk-or-...` | Швидко, без GPU. Опціонально: `OPENROUTER_MODEL` (за замовчуванням: `google/gemma-3-27b-it`) |
| **Google AI Studio** | `LLM_BACKEND=google` `GOOGLE_AI_API_KEY=AI...` | Безкоштовний рівень, ~15 RPM. Опціонально: `GOOGLE_AI_MODEL` |
| **Ollama** | `LLM_BACKEND=ollama` | Локально, потрібен GPU. Спочатку `ollama pull gemma3:27b`. Опціонально: `OLLAMA_HOST`, `OLLAMA_MODEL` |

Без `LLM_BACKEND` система автовизначає бекенд за наявним API ключем (OpenRouter > Google > Ollama).

---

## Встановлення (з вихідного коду)

```bash
git clone https://github.com/vitalii4reva/ai-humanaizer-mcp.git
cd ai-humanaizer
npm install
npm run build
```

При роботі з вихідним кодом створіть `.env.local` в корені проекту з конфігом бекенду (див. таблицю вище), або передайте змінні через MCP-конфіг.

<details>
<summary>Конфіг редактора з локальними шляхами (з вихідного коду)</summary>

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

</details>

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
