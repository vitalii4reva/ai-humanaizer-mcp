/**
 * Google AI Studio (Gemini API) client for Gemma models
 * Uses generativelanguage.googleapis.com — free tier available
 */

import type { ChatMessage, ChatOptions, LLMClient } from './types.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiClientOptions {
  apiKey: string;
  timeoutMs?: number;
}

export class GeminiClient implements LLMClient {
  private apiKey: string;
  private defaultTimeoutMs: number;

  constructor(options: GeminiClientOptions) {
    this.apiKey = options.apiKey;
    this.defaultTimeoutMs = options.timeoutMs ?? 180000;
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    options?: Partial<ChatOptions>
  ): Promise<string> {
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Gemma models on AI Studio don't support systemInstruction —
      // merge system messages into the first user message
      const systemText = messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n\n');

      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      const contents = nonSystemMessages.length > 0
        ? nonSystemMessages.map((m, i) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{
              text: i === 0 && systemText
                ? `${systemText}\n\n${m.content}`
                : m.content,
            }],
          }))
        : [{ role: 'user', parts: [{ text: systemText }] }];

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.85,
          topP: options?.top_p ?? 0.9,
        },
      };

      // JSON schema response format
      if (options?.format) {
        (body.generationConfig as Record<string, unknown>).responseMimeType = 'application/json';
        (body.generationConfig as Record<string, unknown>).responseSchema = options.format;
      }

      // Gemma model IDs on AI Studio need "models/" prefix if not present
      const modelId = model.startsWith('models/') ? model : `models/${model}`;

      const url = `${GEMINI_BASE_URL}/${modelId}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();

        if (response.status === 429) {
          throw new Error(
            `Rate limit exceeded. Google AI Studio free tier: ~15 RPM. Wait a moment and retry. ${errorBody}`
          );
        }
        if (response.status === 400 && errorBody.includes('not found')) {
          throw new Error(
            `Model "${model}" not found on Google AI Studio. Available: gemma-3-27b-it, gemma-3-12b-it, gemma-3-4b-it`
          );
        }
        if (response.status === 403) {
          throw new Error(
            `Invalid API key or model not available. Get a key at https://aistudio.google.com`
          );
        }

        throw new Error(`Google AI Studio error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();

      // Extract text from Gemini response format
      const candidate = data.candidates?.[0];
      if (!candidate?.content?.parts?.[0]?.text) {
        throw new Error(
          `Unexpected response format from Google AI Studio: ${JSON.stringify(data).substring(0, 200)}`
        );
      }

      return candidate.content.parts[0].text;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout (${timeoutMs}ms). Try again.`);
      }
      // Re-throw our own errors
      if (error.message?.includes('Google AI Studio') || error.message?.includes('Rate limit')) {
        throw error;
      }
      throw new Error(`Google AI Studio error: ${error.message || error}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
