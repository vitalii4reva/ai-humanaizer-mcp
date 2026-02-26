/**
 * Factory to create the right LLM client based on environment variables
 *
 * Selection: LLM_BACKEND=openrouter|google|ollama (explicit choice)
 * Auto-detect fallback: first available key wins (openrouter → google → ollama)
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { LLMClient } from './types.js';
import { GeminiClient } from './gemini-client.js';
import { OpenAICompatibleClient } from './openai-compatible-client.js';
// OllamaClient uses 'ollama' package which may pull browser-only APIs (XMLHttpRequest)
// Lazy-import to avoid crashing when user only needs OpenRouter/Google
type OllamaClientType = import('./ollama-client.js').OllamaClient;

// Try repo root (dev), then cwd (user project), then rely on process.env (MCP config)
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoEnv = resolve(__dirname, '..', '..', '..', '.env.local');
const cwdEnv = resolve(process.cwd(), '.env.local');
if (existsSync(repoEnv)) config({ path: repoEnv, quiet: true });
else if (existsSync(cwdEnv)) config({ path: cwdEnv, quiet: true });

export type Backend = 'openrouter' | 'google' | 'ollama';

export interface LLMConfig {
  client: LLMClient;
  model: string;
  backend: Backend;
}

function createOpenRouter(): LLMConfig {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');
  return {
    client: new OpenAICompatibleClient({
      apiKey,
      baseUrl: 'https://openrouter.ai/api/v1',
      timeoutMs: 180000,
    }),
    model: process.env.OPENROUTER_MODEL ?? 'google/gemma-3-27b-it',
    backend: 'openrouter',
  };
}

function createGoogle(): LLMConfig {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set');
  return {
    client: new GeminiClient({ apiKey, timeoutMs: 180000 }),
    model: process.env.GOOGLE_AI_MODEL ?? 'gemma-3-27b-it',
    backend: 'google',
  };
}

async function createOllama(): Promise<LLMConfig> {
  const { OllamaClient } = await import('./ollama-client.js');
  const host = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  const authToken = process.env.OLLAMA_AUTH_TOKEN;
  return {
    client: new OllamaClient({
      host,
      timeoutMs: 180000,
      ...(authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}),
    }),
    model: process.env.OLLAMA_MODEL ?? 'gemma3:27b',
    backend: 'ollama',
  };
}

export async function createLLMClient(): Promise<LLMConfig> {
  const explicit = process.env.LLM_BACKEND?.trim().toLowerCase();

  // Explicit backend selection
  if (explicit) {
    switch (explicit) {
      case 'openrouter': return createOpenRouter();
      case 'google': return createGoogle();
      case 'ollama': return createOllama();
      default:
        throw new Error(`Unknown LLM_BACKEND="${explicit}". Use: openrouter, google, ollama`);
    }
  }

  // Auto-detect: first available key wins
  if (process.env.OPENROUTER_API_KEY) return createOpenRouter();
  if (process.env.GOOGLE_AI_API_KEY) return createGoogle();
  return createOllama();
}
