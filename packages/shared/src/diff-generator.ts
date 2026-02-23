/**
 * DiffGenerator service for comparing original and humanized text
 * Uses sentence-level diffing for semantic comparison
 */

import { diffSentences } from 'diff';
import type { CompareResponse } from './types.js';

export class DiffGenerator {
  /**
   * Generate structured diff between original and humanized text
   */
  generate(original: string, humanized: string): CompareResponse {
    const changes = diffSentences(original, humanized);
    const structuredChanges: CompareResponse['changes'] = [];

    let i = 0;
    while (i < changes.length) {
      const current = changes[i];

      // Skip unchanged parts
      if (!current.added && !current.removed) {
        i++;
        continue;
      }

      // Check for modification pattern (removed followed by added)
      if (
        current.removed &&
        i + 1 < changes.length &&
        changes[i + 1].added
      ) {
        const beforeText = current.value.trim();
        const afterText = changes[i + 1].value.trim();

        // Filter out whitespace-only changes
        if (beforeText.length >= 3 && afterText.length >= 3) {
          structuredChanges.push({
            type: 'modification',
            before: beforeText,
            after: afterText,
          });
        }

        i += 2; // Skip both removed and added parts
        continue;
      }

      // Standalone addition
      if (current.added) {
        const text = current.value.trim();
        if (text.length >= 3) {
          structuredChanges.push({
            type: 'addition',
            before: '',
            after: text,
          });
        }
        i++;
        continue;
      }

      // Standalone deletion
      if (current.removed) {
        const text = current.value.trim();
        if (text.length >= 3) {
          structuredChanges.push({
            type: 'deletion',
            before: text,
            after: '',
          });
        }
        i++;
        continue;
      }

      i++;
    }

    return {
      original,
      humanized,
      changes: structuredChanges,
    };
  }
}
