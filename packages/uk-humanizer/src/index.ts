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
import { z } from 'zod';
import type { HumanizeRequest, HumanizeResponse } from '@ai-humanizer/shared';

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

// Define the humanize_text tool
const humanizeTextTool: Tool = {
  name: 'humanize_text',
  description: 'Humanize AI-generated Ukrainian text to make it sound more natural and undetectable',
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

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [humanizeTextTool],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'humanize_text') {
    const args = request.params.arguments as unknown as HumanizeRequest;

    // Placeholder response - will be implemented in plan 02
    const response: HumanizeResponse = {
      humanized: `[UK - gemma3:27b] Humanized: ${args.text}`,
      detectedStyle: args.style || 'casual',
      changes: ['Placeholder - implementation pending'],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('UK Humanizer MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
