/**
 * TextProcessor service for humanization operations
 * Handles humanize, detectPatterns, and scoreHumanness
 */

import { PromptLoader } from './prompt-loader.js';
import { wrapWithDelimiters } from './input-sanitizer.js';
import type { WritingStyle, DetectPatternsResponse, ScoreResponse, LLMClient } from './types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { jsonrepair } from 'jsonrepair';
import { DetectionOutputSchema, ScoreOutputSchema } from './tool-schemas.js';

export class TextProcessor {
  constructor(
    private ollama: LLMClient,
    private prompts: PromptLoader,
    private readonly model: string = 'gemma3:27b'
  ) {}

  /**
   * Humanize text using the specified writing style
   */
  private countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  }

  async humanize(text: string, style: WritingStyle, passes: number = 1): Promise<string> {
    let current = text;
    for (let pass = 0; pass < passes; pass++) {
      current = await this.singlePassHumanize(current, style);
    }
    return current;
  }

  private async singlePassHumanize(text: string, style: WritingStyle): Promise<string> {
    const wrappedText = wrapWithDelimiters(text);
    const sentenceCount = this.countSentences(text);
    const fullPrompt = this.prompts.render('system', {
      TEXT: wrappedText,
      STYLE: style,
      SENTENCE_COUNT: sentenceCount,
    });

    // Split into system instructions and user content at the delimiter
    const delimiterStart = '|||USER_INPUT_START|||';
    const delimiterEnd = '|||USER_INPUT_END|||';
    const startIdx = fullPrompt.indexOf(delimiterStart);
    const endIdx = fullPrompt.indexOf(delimiterEnd);

    let messages: { role: 'system' | 'user'; content: string }[];
    if (startIdx !== -1 && endIdx !== -1) {
      const systemPart = fullPrompt.substring(0, startIdx).trim();
      const userPart = fullPrompt.substring(startIdx, endIdx + delimiterEnd.length).trim();
      const reminderPart = fullPrompt.substring(endIdx + delimiterEnd.length).trim();
      const systemPrompt = reminderPart ? `${systemPart}\n\n${reminderPart}` : systemPart;
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPart },
      ];
    } else {
      messages = [{ role: 'system', content: fullPrompt }];
    }

    const response = await this.callWithRetry(async () => {
      return await this.ollama.chat(this.model, messages, {
        temperature: 0.85,
        top_p: 0.9,
        repeat_penalty: 1.15,
        think: false,
      });
    });

    return this.postProcess(response);
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
        this.model,
        [{ role: 'system', content: prompt }],
        {
          temperature: 0.3,
          top_p: 0.5,
          repeat_penalty: 1.1,
          format: jsonSchema,
          think: false,
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
        this.model,
        [{ role: 'system', content: prompt }],
        {
          temperature: 0.3,
          top_p: 0.5,
          repeat_penalty: 1.1,
          format: jsonSchema,
          think: false,
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
   * Post-process LLM output to fix common issues models ignore
   */
  /**
   * AI vocabulary replacements map: [pattern, replacement]
   * Replacement can be a string or a function for case-preserving swaps.
   */
  private static readonly AI_REPLACEMENTS: Array<[RegExp, string | ((m: string) => string)]> = [
    // Verbs
    [/\butilizing\b/gi, (m) => m[0] === 'U' ? 'Using' : 'using'],
    [/\butilize\b/gi, (m) => m[0] === 'U' ? 'Use' : 'use'],
    [/\bleveraging\b/gi, (m) => m[0] === 'L' ? 'Using' : 'using'],
    [/\bleverage\b/gi, (m) => m[0] === 'L' ? 'Use' : 'use'],
    [/\bfacilitat(?:e|es|ing)\b/gi, (m) => {
      const cap = m[0] === 'F';
      if (/ing$/i.test(m)) return cap ? 'Helping' : 'helping';
      return cap ? 'Help' : 'help';
    }],
    [/\bstreamlin(?:e|es|ing)\b/gi, (m) => {
      const cap = m[0] === 'S';
      if (/ing$/i.test(m)) return cap ? 'Simplifying' : 'simplifying';
      return cap ? 'Simplify' : 'simplify';
    }],
    // Copula avoidance
    [/\bstands out as\b/gi, 'is'],
    [/\bserves as\b/gi, 'is'],
    [/\bfunctions as\b/gi, 'is'],
    [/\bacts as\b/gi, 'is'],
    // Adjectives/adverbs
    [/\bstraightforward\b/gi, (m) => m[0] === 'S' ? 'Simple' : 'simple'],
    [/\bcomprehensive\b/gi, (m) => m[0] === 'C' ? 'Full' : 'full'],
    [/\bseamless(?:ly)?\b/gi, (m) => {
      const cap = m[0] === 'S';
      if (/ly$/i.test(m)) return cap ? 'Smoothly' : 'smoothly';
      return cap ? 'Smooth' : 'smooth';
    }],
    [/\brobust\b/gi, (m) => m[0] === 'R' ? 'Strong' : 'strong'],
    [/\bcrucial\b/gi, (m) => m[0] === 'C' ? 'Important' : 'important'],
    [/\bparamount\b/gi, (m) => m[0] === 'P' ? 'Important' : 'important'],
    [/\bessential\b/gi, (m) => m[0] === 'E' ? 'Important' : 'important'],
    [/\bvital\b/gi, (m) => m[0] === 'V' ? 'Important' : 'important'],
    [/\bdelve\b/gi, (m) => m[0] === 'D' ? 'Look into' : 'look into'],
  ];

  private postProcess(text: string): string {
    let result = text;
    // Strip preamble lines like "Here's the rewritten text:" or "Okay, here's..."
    result = result.replace(/^(?:okay[,.]?\s*)?here(?:'s| is) the rewritten text[^]*?:\s*\n+/i, '');
    // Replace em dashes with en dashes (models leak these despite instructions)
    result = result.replace(/—/g, '–');
    // Ensure spaces around en dashes (e.g. "word–word" → "word – word")
    result = result.replace(/(\S)–(\S)/g, '$1 – $2');
    // Apply AI vocabulary replacements
    for (const [pattern, replacement] of TextProcessor.AI_REPLACEMENTS) {
      result = result.replace(pattern, replacement as any);
    }
    // Strip trailing superficial -ing clauses (AI tell: "...simplifying the process.", "...enhancing security.")
    result = result.replace(/,\s*(?:simplifying|enhancing|streamlining|highlighting|showcasing|underscoring|facilitating|ensuring|enabling|empowering)\s+[^.!?]*([.!?])/gi, '$1');
    // Strip leading/trailing quotes the model sometimes wraps output in
    result = result.replace(/^["']|["']$/g, '').trim();
    return result;
  }

  /**
   * Retry wrapper for Ollama calls with exponential backoff
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
