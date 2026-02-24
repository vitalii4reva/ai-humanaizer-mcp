/**
 * Factory to create the right LLM client based on environment variables
 *
 * Selection: LLM_BACKEND=openrouter|google|ollama (explicit choice)
 * Auto-detect fallback: first available key wins (openrouter → google → ollama)
 */

import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { LLMClient } from './types.js';
import { OllamaClient } from './ollama-client.js';
import { GeminiClient } from './gemini-client.js';
import { OpenAICompatibleClient } from './openai-compatible-client.js';

// Load .env.local from project root (3 levels up from packages/shared/dist/)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '..', '.env.local') });

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

function createOllama(): LLMConfig {
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

export function createLLMClient(): LLMConfig {
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
