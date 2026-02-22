/**
 * TextProcessor service for UK humanizer
 * Handles humanize, detectPatterns, and scoreHumanness operations
 */

import { OllamaClient, PromptLoader, wrapWithDelimiters, resolveStyle } from '@ai-humanizer/shared';
import type { WritingStyle, DetectPatternsResponse, ScoreResponse } from '@ai-humanizer/shared';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { jsonrepair } from 'jsonrepair';
import { DetectionOutputSchema, ScoreOutputSchema } from '../schemas/tool-schemas.js';

export class TextProcessor {
  private readonly MODEL = 'gemma3:27b';

  constructor(
    private ollama: OllamaClient,
    private prompts: PromptLoader
  ) {}

  /**
   * Humanize text using the specified writing style
   */
  async humanize(text: string, style: WritingStyle): Promise<string> {
    const wrappedText = wrapWithDelimiters(text);
    const systemPrompt = this.prompts.render('system', {
      TEXT: wrappedText,
      STYLE: style,
    });

    const response = await this.callWithRetry(async () => {
      return await this.ollama.chat(
        this.MODEL,
        [{ role: 'system', content: systemPrompt }],
        {
          temperature: 0.85,
          top_p: 0.9,
          repeat_penalty: 1.15,
        }
      );
    });

    return response;
  }

  /**
   * Detect AI patterns in text and return structured analysis
   */
  async detectPatterns(text: string): Promise<DetectPatternsResponse> {
    const wrappedText = wrapWithDelimiters(text);
    const prompt = this.prompts.render('detect', {
      TEXT: wrappedText,
      STYLE: 'professional',
    });

    const jsonSchema = zodToJsonSchema(DetectionOutputSchema);

    const response = await this.callWithRetry(async () => {
      return await this.ollama.chat(
        this.MODEL,
        [{ role: 'system', content: prompt }],
        {
          temperature: 0.3,
          top_p: 0.5,
          repeat_penalty: 1.1,
          format: jsonSchema,
        }
      );
    });

    // Parse and validate JSON response
    try {
      const parsed = JSON.parse(response);
      return DetectionOutputSchema.parse(parsed);
    } catch (parseError: any) {
      // Try repairing malformed JSON
      try {
        const repaired = jsonrepair(response);
        const parsed = JSON.parse(repaired);
        return DetectionOutputSchema.parse(parsed);
      } catch (repairError: any) {
        throw new Error(
          `Failed to parse LLM response for pattern detection: ${parseError.message}. Response: ${response.substring(0, 200)}...`
        );
      }
    }
  }

  /**
   * Score how human a text sounds (0-100)
   */
  async scoreHumanness(text: string): Promise<ScoreResponse> {
    const wrappedText = wrapWithDelimiters(text);
    const prompt = this.prompts.render('score', {
      TEXT: wrappedText,
      STYLE: 'professional',
    });

    const jsonSchema = zodToJsonSchema(ScoreOutputSchema);

    const response = await this.callWithRetry(async () => {
      return await this.ollama.chat(
        this.MODEL,
        [{ role: 'system', content: prompt }],
        {
          temperature: 0.3,
          top_p: 0.5,
          repeat_penalty: 1.1,
          format: jsonSchema,
        }
      );
    });

    // Parse and validate JSON response
    try {
      const parsed = JSON.parse(response);
      return ScoreOutputSchema.parse(parsed);
    } catch (parseError: any) {
      // Try repairing malformed JSON
      try {
        const repaired = jsonrepair(response);
        const parsed = JSON.parse(repaired);
        return ScoreOutputSchema.parse(parsed);
      } catch (repairError: any) {
        throw new Error(
          `Failed to parse LLM response for humanness scoring: ${parseError.message}. Response: ${response.substring(0, 200)}...`
        );
      }
    }
  }

  /**
   * Retry wrapper for Ollama calls with exponential backoff
   * Handles timeout and connection errors
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 2
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Only retry on timeout or connection errors
        const isRetryable =
          error.message?.includes('timeout') ||
          error.message?.includes('ECONNREFUSED') ||
          error.message?.includes('fetch failed');

        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff: 1s, 2s
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError!;
  }
}
