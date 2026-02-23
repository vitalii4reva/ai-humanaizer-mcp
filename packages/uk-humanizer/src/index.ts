#!/usr/bin/env node

/**
 * UK Humanizer MCP Server
 * Uses gemma3:27b model for Ukrainian text humanization
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import {
  OllamaClient,
  PromptLoader,
  resolveStyle,
  TextProcessor,
  DiffGenerator,
  HumanizeInputSchema,
  DetectInputSchema,
  CompareInputSchema,
  ScoreInputSchema,
  HumanizeUntilHumanInputSchema,
} from '@ai-humanizer/shared';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const server = new Server(
  {
    name: 'uk-humanizer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const humanizeTextTool: Tool = {
  name: 'humanize_text',
  description: 'Rewrite AI-generated Ukrainian text to sound natural and human',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to humanize',
      },
      style: {
        type: 'string',
        enum: ['casual', 'professional', 'academic', 'blog', 'journalistic'],
        description: 'Writing style (optional, will auto-detect if not provided)',
      },
      passes: {
        type: 'number',
        description: 'Number of humanization passes (1-3, default: 1). Use 2 for how-to/instructional content to break structural patterns.',
      },
    },
    required: ['text'],
  },
};

const detectAiPatternsTool: Tool = {
  name: 'detect_ai_patterns',
  description: 'Analyze Ukrainian text for AI writing patterns including rusyzmy, kancelyaryzmy, and AI-leksyka',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to analyze',
      },
    },
    required: ['text'],
  },
};

const compareVersionsTool: Tool = {
  name: 'compare_versions',
  description: 'Humanize Ukrainian text and show original vs rewritten with list of specific changes',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to humanize and compare',
      },
      style: {
        type: 'string',
        enum: ['casual', 'professional', 'academic', 'blog', 'journalistic'],
        description: 'Writing style (optional, will auto-detect if not provided)',
      },
      passes: {
        type: 'number',
        description: 'Number of humanization passes (1-3, default: 1).',
      },
    },
    required: ['text'],
  },
};

const scoreHumannessTool: Tool = {
  name: 'score_humanness',
  description: 'Rate Ukrainian text 0-100 on humanness with Ukrainian-specific findings explaining the score',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to score',
      },
    },
    required: ['text'],
  },
};

const humanizeUntilHumanTool: Tool = {
  name: 'humanize_until_human',
  description: 'Iteratively rewrite AI Ukrainian text until humanness score reaches target threshold (default 75%). Returns final text, score, and iteration history.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to humanize',
      },
      style: {
        type: 'string',
        enum: ['casual', 'professional', 'academic', 'blog', 'journalistic'],
        description: 'Writing style (optional, will auto-detect if not provided)',
      },
      min_score: {
        type: 'number',
        description: 'Minimum humanness score to achieve (0-100, default: 75)',
      },
      max_iterations: {
        type: 'number',
        description: 'Maximum rewrite attempts (1-10, default: 5)',
      },
    },
    required: ['text'],
  },
};

// Start the server
async function main() {
  // Initialize services
  const ollama = new OllamaClient('http://127.0.0.1:11434', 180000);

  // Resolve prompt directory (repo root + prompts/uk)
  const promptDir = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'prompts',
    'uk'
  );

  const prompts = new PromptLoader(promptDir);
  await prompts.initialize();

  const processor = new TextProcessor(ollama, prompts);
  const diffGen = new DiffGenerator();

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        humanizeTextTool,
        detectAiPatternsTool,
        compareVersionsTool,
        scoreHumannessTool,
        humanizeUntilHumanTool,
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'humanize_text': {
          const input = HumanizeInputSchema.parse(args);
          const finalStyle = resolveStyle(input.text, input.style);
          const humanized = await processor.humanize(input.text, finalStyle, input.passes ?? 1);

          return {
            content: [
              {
                type: 'text',
                text: humanized,
              },
            ],
            structuredContent: {
              humanized,
              detectedStyle: finalStyle,
              originalLength: input.text.length,
              humanizedLength: humanized.length,
            },
          };
        }

        case 'detect_ai_patterns': {
          const input = DetectInputSchema.parse(args);
          const result = await processor.detectPatterns(input.text);

          // Format human-readable summary
          const summary = [
            `Found ${result.patterns.length} AI patterns (AI score: ${result.aiScore}%)`,
            '',
            '## Patterns Detected',
            ...result.patterns.map(
              (p, i) =>
                `${i + 1}. **${p.pattern}** (${p.severity})\n   Examples: ${p.examples.join(', ')}`
            ),
            '',
            '## Suggestions',
            ...result.suggestions.map((s, i) => `${i + 1}. ${s}`),
          ].join('\n');

          return {
            content: [
              {
                type: 'text',
                text: summary,
              },
            ],
            structuredContent: result,
          };
        }

        case 'compare_versions': {
          const input = CompareInputSchema.parse(args);
          const finalStyle = resolveStyle(input.text, input.style);
          const humanized = await processor.humanize(input.text, finalStyle, input.passes ?? 1);
          const comparison = diffGen.generate(input.text, humanized);

          // Format human-readable output
          const formatted = [
            '## Original',
            input.text,
            '',
            '## Humanized',
            humanized,
            '',
            `## Changes (${comparison.changes.length})`,
            ...comparison.changes.map((c, i) => {
              if (c.type === 'modification') {
                return `${i + 1}. Modified:\n   Before: ${c.before}\n   After: ${c.after}`;
              } else if (c.type === 'addition') {
                return `${i + 1}. Added: ${c.after}`;
              } else {
                return `${i + 1}. Removed: ${c.before}`;
              }
            }),
          ].join('\n');

          return {
            content: [
              {
                type: 'text',
                text: formatted,
              },
            ],
            structuredContent: comparison,
          };
        }

        case 'score_humanness': {
          const input = ScoreInputSchema.parse(args);
          const result = await processor.scoreHumanness(input.text);

          // Format human-readable output
          const formatted = [
            `Humanness Score: ${result.score}/100`,
            '',
            '## Findings',
            ...result.findings.map(
              (f, i) =>
                `${i + 1}. **${f.category}** (impact: ${f.impact})\n   ${f.detail}`
            ),
          ].join('\n');

          return {
            content: [
              {
                type: 'text',
                text: formatted,
              },
            ],
            structuredContent: result,
          };
        }

        case 'humanize_until_human': {
          const input = HumanizeUntilHumanInputSchema.parse(args);
          const finalStyle = resolveStyle(input.text, input.style);
          const minScore = input.min_score ?? 75;
          const maxIterations = input.max_iterations ?? 5;

          let currentText = input.text;
          const history: { iteration: number; score: number }[] = [];
          let bestText = currentText;
          let bestScore = 0;
          let plateauCount = 0;

          for (let i = 1; i <= maxIterations; i++) {
            const scoreResult = await processor.scoreHumanness(currentText);
            history.push({ iteration: i, score: scoreResult.score });

            if (scoreResult.score > bestScore) {
              bestScore = scoreResult.score;
              bestText = currentText;
              plateauCount = 0;
            } else {
              plateauCount++;
            }

            if (scoreResult.score >= minScore) {
              const formatted = [
                `## Humanization Complete`,
                `**Target:** ${minScore}% | **Achieved:** ${scoreResult.score}% | **Iterations:** ${i === 1 ? '0 (already human)' : i - 1}`,
                '',
                '## Final Text',
                currentText,
                '',
                '## Score History',
                ...history.map(h => `- Iteration ${h.iteration}: ${h.score}%`),
              ].join('\n');

              return {
                content: [{ type: 'text', text: formatted }],
                structuredContent: {
                  text: currentText,
                  score: scoreResult.score,
                  iterations: i - 1,
                  targetReached: true,
                  history,
                },
              };
            }

            if (plateauCount >= 2) {
              const formatted = [
                `## Humanization Stopped (plateau)`,
                `**Target:** ${minScore}% | **Best:** ${bestScore}% | **Iterations:** ${i} (score stopped improving)`,
                '',
                '## Final Text',
                bestText,
                '',
                '## Score History',
                ...history.map(h => `- Iteration ${h.iteration}: ${h.score}%`),
              ].join('\n');

              return {
                content: [{ type: 'text', text: formatted }],
                structuredContent: {
                  text: bestText,
                  score: bestScore,
                  iterations: i,
                  targetReached: false,
                  stoppedReason: 'plateau',
                  history,
                },
              };
            }

            currentText = await processor.humanize(currentText, finalStyle);
          }

          const finalScore = await processor.scoreHumanness(currentText);
          history.push({ iteration: maxIterations + 1, score: finalScore.score });
          if (finalScore.score > bestScore) {
            bestScore = finalScore.score;
            bestText = currentText;
          }

          const formatted = [
            `## Humanization Incomplete`,
            `**Target:** ${minScore}% | **Best:** ${bestScore}% | **Iterations:** ${maxIterations} (max reached)`,
            '',
            '## Final Text',
            bestText,
            '',
            '## Score History',
            ...history.map(h => `- Iteration ${h.iteration}: ${h.score}%`),
          ].join('\n');

          return {
            content: [{ type: 'text', text: formatted }],
            structuredContent: {
              text: bestText,
              score: bestScore,
              iterations: maxIterations,
              targetReached: bestScore >= minScore,
              stoppedReason: 'max_iterations',
              history,
            },
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      console.error(`Error in tool ${name}:`, error.message);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Graceful shutdown
  const shutdown = async () => {
    await prompts.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('UK Humanizer MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
