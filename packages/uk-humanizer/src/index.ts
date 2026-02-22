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
import { OllamaClient, PromptLoader, resolveStyle } from '@ai-humanizer/shared';
import { TextProcessor } from './services/text-processor.js';
import { DiffGenerator } from './services/diff-generator.js';
import {
  HumanizeInputSchema,
  DetectInputSchema,
  CompareInputSchema,
  ScoreInputSchema,
} from './schemas/tool-schemas.js';
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
          const humanized = await processor.humanize(input.text, finalStyle);

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
          const humanized = await processor.humanize(input.text, finalStyle);
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

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('UK Humanizer MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
