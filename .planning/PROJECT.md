# AI Humanaizer

## What This Is

Two local MCP servers (en-humanizer + uk-humanizer) that rewrite AI-generated text to sound indistinguishable from human writing. Powered by local Ollama models (qwen3:30b for English, gemma3:27b for Ukrainian). Used in Claude Code, Zed, and Windsurf as MCP tool providers.

## Core Value

Text rewritten by this tool must be undetectable as AI-generated — natural rhythm, authentic voice, zero AI patterns.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Two separate MCP servers: en-humanizer and uk-humanizer
- [ ] Each server exposes 4 tools: humanize_text, detect_ai_patterns, compare_versions, score_humanness
- [ ] humanize_text: rewrites AI text to sound human, auto-detects writing style from input with manual override
- [ ] detect_ai_patterns: analyzes text for AI patterns without rewriting, lists specific issues found
- [ ] compare_versions: shows before/after diff of what changed during humanization
- [ ] score_humanness: rates text 0-100% on how human it sounds
- [ ] Prompts stored in external files (prompts/*.md) for easy tuning without rebuild
- [ ] EN prompts based on humanizer skill knowledge (24 AI writing patterns from Wikipedia)
- [ ] UK prompts based on ukrainianizer skill knowledge (rusyzmy, kancelyaryzmy, AI-leksyka, burstiness/perplexity)
- [ ] Auto-detect writing style from input text (casual, professional, academic, blog, journalistic)
- [ ] Manual style override via optional parameter
- [ ] Works with Ollama running locally on localhost:11434
- [ ] en-humanizer defaults to qwen3:30b model
- [ ] uk-humanizer defaults to gemma3:27b model
- [ ] MCP config examples for Claude Code, Zed, and Windsurf

### Out of Scope

- Cloud API models (OpenAI, Anthropic) — local Ollama only
- Web UI or REST API — MCP stdio transport only
- Real-time streaming of responses — full response only
- Training or fine-tuning models — use stock Ollama models with prompts
- Mobile or browser clients — desktop editors only

## Context

- Machine: MacBook Pro M3 Max (36GB+ RAM)
- Ollama models already pulled: qwen3:30b (~20GB RAM), gemma3:27b (~18GB RAM)
- MCP servers are lightweight Node.js processes (~40MB RAM each), models loaded by Ollama on-demand
- Ollama keeps models in RAM for 5 min after last request, then unloads
- Humanizer skill provides 24 documented AI writing patterns (Wikipedia-sourced): inflated significance, promotional language, -ing analyses, vague attributions, AI vocabulary, copula avoidance, negative parallelisms, rule of three, em dash overuse, etc.
- Ukrainianizer skill provides Ukrainian-specific patterns: rusyzmy (Russian calques), kancelyaryzmy (nominalization), anglicyzmy (English calques), pleonazmy, AI-leksyka, plus statistical markers (burstiness, perplexity, TTR, emotional variance)
- Reference prompts exist in info.md with temperature/top_p/repeat_penalty tuning

## Constraints

- **Transport**: MCP stdio only — editors launch the process, communicate via stdin/stdout
- **Runtime**: Node.js + TypeScript, @modelcontextprotocol/sdk, ollama npm package
- **Models**: Only locally available Ollama models (qwen3:30b, gemma3:27b)
- **Latency**: Expect 5-30 seconds per humanization depending on text length and model
- **Language**: EN server handles English only, UK server handles Ukrainian only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two separate servers vs one | User preference for isolation; each language has distinct prompts, models, and AI pattern databases | — Pending |
| External prompt files | Allows tuning prompts without rebuilding TypeScript; faster iteration | — Pending |
| Auto-detect style | User shouldn't need to specify style manually every time; MCP analyzes input and adapts | — Pending |
| qwen3:30b for EN, gemma3:27b for UK | qwen3 has stronger English reasoning; gemma3 has better Ukrainian/Slavic language support per benchmarks | — Pending |

---
*Last updated: 2026-02-22 after initialization*
