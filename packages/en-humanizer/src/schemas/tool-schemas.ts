/**
 * Zod schemas for EN humanizer tool inputs and outputs
 */

import { z } from 'zod';

// Input schemas
export const HumanizeInputSchema = z.object({
  text: z.string().min(1),
  style: z.enum(['casual', 'professional', 'academic', 'blog', 'journalistic']).optional(),
});

export const DetectInputSchema = z.object({
  text: z.string().min(1),
});

export const CompareInputSchema = z.object({
  text: z.string().min(1),
  style: z.enum(['casual', 'professional', 'academic', 'blog', 'journalistic']).optional(),
});

export const ScoreInputSchema = z.object({
  text: z.string().min(1),
});

// Output schemas for structured LLM responses
export const DetectionOutputSchema = z.object({
  patterns: z.array(
    z.object({
      pattern: z.string(),
      examples: z.array(z.string()),
      severity: z.enum(['high', 'medium', 'low']),
    })
  ),
  aiScore: z.number().min(0).max(100),
  suggestions: z.array(z.string()),
});

export const ScoreOutputSchema = z.object({
  score: z.number().min(0).max(100),
  findings: z.array(
    z.object({
      category: z.string(),
      detail: z.string(),
      impact: z.number(),
    })
  ),
});

// Inferred TypeScript types
export type HumanizeInput = z.infer<typeof HumanizeInputSchema>;
export type DetectInput = z.infer<typeof DetectInputSchema>;
export type CompareInput = z.infer<typeof CompareInputSchema>;
export type ScoreInput = z.infer<typeof ScoreInputSchema>;
export type DetectionOutput = z.infer<typeof DetectionOutputSchema>;
export type ScoreOutput = z.infer<typeof ScoreOutputSchema>;
