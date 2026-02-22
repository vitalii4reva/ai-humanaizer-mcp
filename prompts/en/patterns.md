# AI Writing Patterns Reference

This document catalogs AI writing patterns to identify and eliminate during humanization. Based on Wikipedia's "Signs of AI writing" and research into LLM-generated text characteristics.

## Linguistic Patterns

### 1. Inflated Significance
**Description:** Overuse of grandiose terms to make ordinary topics sound revolutionary.

**AI Example:** "This groundbreaking, paradigm-shifting approach revolutionizes the way we think about coffee brewing."

**Human Version:** "This new method changes how we brew coffee."

---

### 2. Promotional Language
**Description:** Marketing-speak and hyperbolic claims without factual basis.

**AI Example:** "Unlock the secret to mastering productivity with this game-changing strategy that top executives don't want you to know."

**Human Version:** "Here's a productivity technique that works for many people."

---

### 3. -ing Form Overuse in Analyses
**Description:** Excessive use of present participles in analytical contexts where simpler forms work better.

**AI Example:** "By examining the underlying factors contributing to the situation, we can begin understanding the implications emerging from these findings."

**Human Version:** "When we look at the root causes, we can understand what these findings mean."

---

### 4. Vague Attributions
**Description:** Generic references to unnamed authorities without specific sources.

**AI Example:** "Experts say that climate change is affecting weather patterns. Studies show significant impact. Research indicates growing concern."

**Human Version:** "According to a 2024 IPCC report, rising temperatures have altered precipitation patterns across North America."

---

### 5. AI Vocabulary (Jargon Inflation)
**Description:** Unnecessarily complex words when simpler alternatives exist.

**AI Phrases:** "leverage", "utilize", "facilitate", "comprehensive", "delve", "multifaceted", "robust", "holistic", "synergy", "optimize", "paradigm", "cutting-edge"

**Human Alternatives:** "use", "use", "help", "complete/full", "explore/look into", "complex", "strong", "complete", "teamwork", "improve", "model/approach", "new"

---

### 6. Copula Avoidance
**Description:** Awkward sentence structures avoiding simple "is/are/was/were" constructions.

**AI Example:** "This represents a significant development in the field."

**Human Version:** "This is a significant development in the field."

---

### 7. Negative Parallelisms
**Description:** Repetitive "not X but Y" constructions for emphasis.

**AI Example:** "It's not just a tool, but a complete solution. Not merely a product, but a revolutionary platform. Not simply software, but an ecosystem."

**Human Version:** "It's a complete solution that does X, Y, and Z."

---

## Structural Patterns

### 8. Rule of Three Lists
**Description:** Excessive use of three-item lists for rhetorical effect.

**AI Example:** "This approach is efficient, effective, and elegant. It saves time, reduces costs, and improves outcomes. Teams become faster, smarter, and more collaborative."

**Human Version:** Mix list lengths. Sometimes use two items, sometimes four. Vary structure to avoid mechanical rhythm.

---

### 9. Em Dash Overuse
**Description:** Em dashes used excessively for dramatic pauses instead of varied punctuation.

**AI Example:** "The solution — which leverages AI technology — transforms workflows — creating efficiency gains — while reducing costs — and improving quality."

**Human Version:** "The solution leverages AI to transform workflows. It creates efficiency gains, reduces costs, and improves quality."

---

### 10. Symmetric Paragraph Structure
**Description:** Paragraphs with identical internal structure (topic sentence + 3 supporting sentences + conclusion).

**AI Example:** Every paragraph follows: statement, evidence, evidence, evidence, restatement.

**Human Version:** Vary paragraph structure. One-sentence paragraphs. Long analytical paragraphs. Lists. Mix it up.

---

### 11. Formulaic Transitions
**Description:** Overreliance on standard transition words instead of natural flow.

**AI Phrases:** "Furthermore", "Moreover", "Additionally", "In addition", "In conclusion", "To summarize", "In summary", "Therefore", "Thus", "Hence", "Consequently"

**Human Alternatives:** "And", "Also", "Plus", "What's more", "So", "That's why", natural flow without explicit transitions

---

### 12. Uniform Sentence Length (Low Burstiness)
**Description:** All sentences roughly the same length, creating monotonous rhythm.

**AI Example:** Sentences averaging 15-18 words each, with minimal variation (burstiness < 1.0).

**Human Version:** Mix dramatically. Three-word sentence. Then a longer, more complex sentence that explores an idea in depth with multiple clauses and detailed explanation. Back to short. See?

---

## Content Patterns

### 13. Hedging Language
**Description:** Excessive qualification showing AI uncertainty.

**AI Phrases:** "It's worth noting", "It should be mentioned", "It's important to recognize", "One might argue", "It could be said", "To some extent"

**Human Version:** State it directly. If you're uncertain, say why specifically, not with generic hedges.

---

### 14. Meta-Commentary
**Description:** Narrating what the text is about to do instead of doing it.

**AI Example:** "In this section, we will explore the various factors. First, we'll examine the background. Then, we'll analyze the implications."

**Human Version:** Just do it. No narration. "Three factors matter. First, the background..."

---

### 15. Excessive Qualification
**Description:** Piling on modifiers and disclaimers to avoid definitive statements.

**AI Example:** "While it might potentially be considered possible that some users could potentially experience certain benefits under specific circumstances, individual results may vary significantly."

**Human Version:** "Users might see benefits, but results vary."

---

### 16. Lack of Personal Voice
**Description:** Completely impersonal, voiceless prose with no hint of individual perspective.

**AI Example:** Text reads like a committee wrote it. No "I", no opinions, no personality, no specific examples from experience.

**Human Version:** Occasional first-person. Specific anecdotes. Clear perspective. "I've seen this fail three times when..."

---

### 17. Over-Summarization
**Description:** Summarizing content immediately after presenting it.

**AI Example:** "The data shows X, Y, and Z. In summary, the data demonstrates X, Y, and Z. To recap, these findings indicate X, Y, and Z."

**Human Version:** Say it once. Move on.

---

### 18. Listicle Formatting Without Substance
**Description:** Generic numbered lists with shallow, interchangeable items.

**AI Example:** "5 Ways to Improve Productivity: 1. Focus on priorities. 2. Eliminate distractions. 3. Take breaks. 4. Stay organized. 5. Set goals."

**Human Version:** Fewer items with depth. Specific examples. Real numbers. "One change doubled my output: I stopped checking email before 10am."

---

## Statistical Markers

### 19. Low Perplexity (Predictable Word Choices)
**Description:** Highly predictable word sequences; low surprise in lexical choices.

**AI Example:** Common word collocations repeated: "significant impact", "important role", "key factor", "critical component", "essential element"

**Human Version:** Unexpected word choices. Fresh metaphors. Specific verbs. "This wrecked our timeline." not "This negatively impacted our timeline."

---

### 20. Uniform Type-Token Ratio
**Description:** Consistent vocabulary richness throughout text; no variation in lexical density.

**AI Example:** Every paragraph has similar vocabulary complexity, same ratio of unique words to total words.

**Human Version:** Vary lexical density. Technical sections = dense. Explanations = simpler. Stories = specific.

---

### 21. Lack of Colloquialisms
**Description:** Perfectly formal prose with zero informal expressions, contractions, or regional language.

**AI Example:** "It is not possible to do that" instead of "You can't do that" or "No way that works"

**Human Version:** Mix formality. "The data's clear — this won't work. But here's what might."

---

### 22. Perfect Grammar Without Idiomatic Variation
**Description:** Technically correct but unnaturally rigid; no idiomatic expressions or acceptable "errors".

**AI Example:** Never splits infinitives, never ends sentences with prepositions, never uses sentence fragments.

**Human Version:** Break rules for effect. Sentence fragments? Absolutely. Split infinitives when it sounds better to naturally place them.

---

### 23. Absent Emotional Variance
**Description:** Uniform emotional tone; no shifts in intensity, urgency, or sentiment.

**AI Example:** Consistently neutral/professional tone throughout, even when discussing inherently emotional topics.

**Human Version:** Let tone shift with content. Frustration when describing problems. Excitement for breakthroughs. Deadpan for absurdity.

---

### 24. Citation Style Inconsistency (Wikipedia-specific)
**Description:** Generic references mixed with specific citations in ways that suggest non-human editing.

**AI Example:** "According to researchers (2024), studies show..." then suddenly "[1] Smith, J. Nature 2023" with no consistent pattern.

**Human Version:** Consistent citation style throughout. Either all inline or all footnoted. Not random mixing.

---

## Detection Summary

When analyzing text for AI patterns, look for **clusters** of these patterns rather than single instances. Human writing can occasionally use any one of these patterns; AI writing uses many simultaneously.

**High AI likelihood:** 8+ patterns, low burstiness (< 1.0), low perplexity (< 50), symmetric structure

**Medium AI likelihood:** 4-7 patterns, moderate variation, some formulaic language

**Low AI likelihood:** 0-3 patterns, high burstiness (> 1.5), unexpected word choices, personal voice
