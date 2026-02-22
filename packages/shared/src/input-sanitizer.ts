/**
 * Input sanitization and prompt injection protection
 */

/**
 * Sanitize user input to prevent prompt injection attempts
 *
 * Detects suspicious patterns and strips them, logging warnings to stderr.
 * Does NOT throw - the tool should still work, we just neuter injection attempts.
 */
export function sanitizeInput(text: string): string {
  // Trim whitespace
  let sanitized = text.trim();

  // Check for suspicious prompt injection patterns
  const suspiciousPatterns = [
    /ignore\s+previous/gi,
    /disregard\s+all/gi,
    /disregard\s+previous/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /you\s+are\s+now/gi,
    /forget\s+everything/gi,
    /override\s+instructions?/gi
  ];

  let foundSuspicious = false;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      foundSuspicious = true;
      // Strip the suspicious pattern
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
  }

  if (foundSuspicious) {
    console.error('[input-sanitizer] Warning: Suspicious prompt injection patterns detected and neutralized');
  }

  return sanitized;
}

/**
 * Wrap sanitized text in delimiters for prompt injection protection
 *
 * The delimiters instruct the LLM to treat content as data, not commands.
 */
export function wrapWithDelimiters(text: string): string {
  const sanitized = sanitizeInput(text);
  return `|||USER_INPUT_START|||\n${sanitized}\n|||USER_INPUT_END|||`;
}
