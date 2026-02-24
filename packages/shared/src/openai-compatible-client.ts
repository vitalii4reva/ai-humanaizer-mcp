/**
 * OpenAI-compatible API client (works with OpenRouter, DeepInfra, Together, etc.)
 */

import type { ChatMessage, ChatOptions, LLMClient } from './types.js';

export interface OpenAICompatibleClientOptions {
  apiKey: string;
  baseUrl: string;
  timeoutMs?: number;
}

export class OpenAICompatibleClient implements LLMClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultTimeoutMs: number;

  constructor(options: OpenAICompatibleClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
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
      const body: Record<string, unknown> = {
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.85,
        top_p: options?.top_p ?? 0.9,
      };

      if (options?.format) {
        body.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. ${errorBody}`);
        }
        throw new Error(`API error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`Empty response: ${JSON.stringify(data).substring(0, 200)}`);
      }
      return content;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout (${timeoutMs}ms). Try again.`);
      }
      if (error.message?.includes('Rate limit') || error.message?.includes('API error')) {
        throw error;
      }
      throw new Error(`API error: ${error.message || error}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
