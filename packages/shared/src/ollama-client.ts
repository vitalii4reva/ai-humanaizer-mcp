/**
 * Ollama client wrapper with timeout and graceful error handling
 */

import { Ollama } from 'ollama';
import type { ChatMessage, ChatOptions, LLMClient } from './types.js';

export interface OllamaClientOptions {
  host?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export class OllamaClient implements LLMClient {
  private ollama: Ollama;
  private defaultTimeoutMs: number;
  private host: string;

  constructor(options: OllamaClientOptions = {}) {
    this.host = options.host ?? 'http://127.0.0.1:11434';
    this.defaultTimeoutMs = options.timeoutMs ?? 180000;
    this.ollama = new Ollama({
      host: this.host,
      ...(options.headers ? { headers: options.headers } : {}),
    });
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
      const chatOptions: Record<string, unknown> = {
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature,
          top_p: options?.top_p,
          repeat_penalty: options?.repeat_penalty,
        },
        signal: controller.signal,
      };

      if (options?.format) {
        chatOptions.format = options.format;
      }
      if (options?.think !== undefined) {
        chatOptions.think = options.think;
      }

      const response = await (this.ollama as any).chat(chatOptions);

      return response.message.content;
    } catch (error: any) {
      // AbortError from timeout — check BEFORE connection errors
      // because abort can produce "fetch failed" message too
      if (
        error.name === 'AbortError' ||
        (controller.signal.aborted && error.message?.includes('fetch failed'))
      ) {
        throw new Error(
          `Model loading timeout (${timeoutMs}ms). The model may still be loading. Try again in 30 seconds.`
        );
      }

      // Ollama service not running
      if (
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('fetch failed') ||
        error.code === 'ECONNREFUSED'
      ) {
        throw new Error(
          `Ollama is not running. Start it with: ollama serve`
        );
      }

      // Model not found
      if (
        error.status === 404 ||
        error.message?.includes('model not found') ||
        (error.message?.includes('model') && error.message?.includes('not found'))
      ) {
        throw new Error(
          `Model "${model}" not found. Pull it with: ollama pull ${model}`
        );
      }

      // Re-throw other errors with context
      throw new Error(`Ollama error: ${error.message || error}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.host}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async checkHealth(): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        `Ollama is not available at ${this.host}. Make sure it's running with: ollama serve`
      );
    }
  }
}
