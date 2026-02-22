/**
 * Style detection for automatic writing style classification
 */

import type { WritingStyle } from './types.js';

export class StyleDetector {
  /**
   * Detect writing style from text using rule-based classification
   */
  detect(text: string): WritingStyle {
    const sentences = this.extractSentences(text);

    if (sentences.length === 0) {
      return 'professional'; // Default fallback
    }

    // Feature extraction
    const features = this.extractFeatures(text, sentences);

    // Rule-based classification
    return this.classify(features);
  }

  private extractSentences(text: string): string[] {
    // Split on sentence boundaries (., !, ?)
    // Handle common abbreviations that shouldn't split
    const normalized = text
      .replace(/Mr\./g, 'Mr')
      .replace(/Mrs\./g, 'Mrs')
      .replace(/Dr\./g, 'Dr')
      .replace(/vs\./g, 'vs')
      .replace(/etc\./g, 'etc')
      .replace(/i\.e\./g, 'ie')
      .replace(/e\.g\./g, 'eg');

    return normalized
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private extractFeatures(text: string, sentences: string[]) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;

    // Average sentence length (words per sentence)
    const avgSentenceLength = totalWords / sentences.length;

    // Vocabulary richness (type-token ratio)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabRichness = uniqueWords.size / totalWords;

    // Count contractions
    const contractions = (text.match(/n't|'s|'re|'ve|'ll|'d/g) || []).length;
    const contractionRate = contractions / totalWords;

    // Count exclamations and questions
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;

    // First-person pronouns (blog indicator)
    const firstPersonCount = (text.match(/\b(I|me|my|mine|we|us|our|ours)\b/gi) || []).length;
    const firstPersonRate = firstPersonCount / totalWords;

    // Passive voice indicators (academic/professional)
    const passiveIndicators = (text.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || []).length;
    const passiveRate = passiveIndicators / sentences.length;

    // Average word length
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / totalWords;

    return {
      avgSentenceLength,
      vocabRichness,
      contractionRate,
      exclamations,
      questions,
      firstPersonRate,
      passiveRate,
      avgWordLength,
      sentenceCount: sentences.length
    };
  }

  private classify(features: ReturnType<typeof this.extractFeatures>): WritingStyle {
    const {
      avgSentenceLength,
      vocabRichness,
      contractionRate,
      exclamations,
      questions,
      firstPersonRate,
      passiveRate,
      avgWordLength,
      sentenceCount
    } = features;

    // Academic: long sentences, rich vocabulary, few contractions, passive voice
    if (avgSentenceLength > 22 && vocabRichness > 0.65 && contractionRate < 0.01 && passiveRate > 0.2) {
      return 'academic';
    }

    // Casual: many contractions, exclamations, short sentences
    if (contractionRate > 0.05 || exclamations > 2 || avgSentenceLength < 12) {
      return 'casual';
    }

    // Journalistic: short-medium sentences, multiple sentences, low first-person, medium vocabulary
    if (avgSentenceLength >= 12 && avgSentenceLength < 18 && sentenceCount > 3 && firstPersonRate < 0.02) {
      return 'journalistic';
    }

    // Blog: first-person pronouns, moderate sentence length, questions
    if (firstPersonRate > 0.03 || questions > 1) {
      return 'blog';
    }

    // Professional: default fallback (moderate formality, business-like)
    return 'professional';
  }
}

/**
 * Resolve final style: manual override takes precedence, otherwise auto-detect
 */
export function resolveStyle(text: string, manualOverride?: WritingStyle): WritingStyle {
  if (manualOverride) {
    return manualOverride;
  }

  const detector = new StyleDetector();
  return detector.detect(text);
}
