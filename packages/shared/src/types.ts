/**
 * Shared TypeScript types for AI Humanizer MCP servers
 */

export type WritingStyle = 'casual' | 'professional' | 'academic' | 'blog' | 'journalistic';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export type OllamaChatMessage = ChatMessage;

export interface ChatOptions {
  temperature?: number;
  top_p?: number;
  repeat_penalty?: number;
  timeoutMs?: number;
  format?: Record<string, unknown>;
  think?: boolean;
}
export type OllamaModelConfig = ChatOptions & { model: string };

export interface LLMClient {
  chat(model: string, messages: ChatMessage[], options?: Partial<ChatOptions>): Promise<string>;
}

export interface HumanizeRequest {
  text: string;
  style?: WritingStyle;
}

export interface HumanizeResponse {
  humanized: string;
  detectedStyle: WritingStyle;
  changes: string[];
}

export interface DetectPatternsResponse {
  patterns: {
    pattern: string;
    examples: string[];
    severity: 'high' | 'medium' | 'low';
  }[];
  aiScore: number;
  suggestions: string[];
}

export interface ScoreResponse {
  score: number;
  findings: {
    category: string;
    detail: string;
    impact: number;
  }[];
}

export interface CompareResponse {
  original: string;
  humanized: string;
  changes: {
    type: string;
    before: string;
    after: string;
  }[];
}

export interface PromptVariables {
  TEXT: string;
  STYLE: WritingStyle;
  SENTENCE_COUNT?: number;
  PATTERNS?: string;
}
