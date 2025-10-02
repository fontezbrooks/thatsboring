#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { editDocument } from './tools/editDocument.js';
import { analyzeStructure } from './tools/analyzeStructure.js';
import { checkClarity } from './tools/checkClarity.js';

const server = new Server(
  {
    name: 'writing-editor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'edit_document',
        description: 'Edit document/text applying all writing rules with tracked changes',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to edit'
            },
            documentType: {
              type: 'string',
              enum: ['full_paper', 'section', 'paragraph', 'abstract'],
              description: 'Type of document being edited',
              default: 'section'
            },
            outputFormat: {
              type: 'string',
              enum: ['tracked_changes', 'clean', 'both'],
              description: 'Output format for the edited document',
              default: 'tracked_changes'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'analyze_structure',
        description: 'Validate document structure and suggest improvements',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The document text to analyze'
            },
            expectedSections: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional list of expected sections'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'check_clarity_metrics',
        description: 'Analyze clarity metrics and identify problem areas',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to analyze for clarity'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'optimize_section',
        description: 'Optimize a specific section type (intro, abstract, conclusion, etc)',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The section text to optimize'
            },
            sectionType: {
              type: 'string',
              enum: ['introduction', 'abstract', 'overview', 'conclusion', 'technical', 'results'],
              description: 'Type of section to optimize'
            }
          },
          required: ['text', 'sectionType']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error('No arguments provided');
    }

    switch (name) {
      case 'edit_document': {
        const result = await editDocument(
          args.text as string,
          args.documentType as string || 'section',
          args.outputFormat as string || 'tracked_changes'
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'analyze_structure': {
        const result = await analyzeStructure(
          args.text as string,
          args.expectedSections as string[] | undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'check_clarity_metrics': {
        const result = await checkClarity(args.text as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'optimize_section': {
        const sectionTypeMap: { [key: string]: string } = {
          'introduction': 'full_paper',
          'abstract': 'abstract',
          'overview': 'section',
          'conclusion': 'section',
          'technical': 'section',
          'results': 'section'
        };

        const documentType = sectionTypeMap[args.sectionType as string] || 'section';
        const result = await editDocument(
          args.text as string,
          documentType,
          'both'
        );

        const optimized = {
          optimized: result.edited,
          originalMetrics: {
            words: (args.text as string).split(/\s+/).length
          },
          optimizedMetrics: result.metrics,
          improvements: result.suggestions
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(optimized, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`
        }
      ]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write('Writing Editor MCP Server running on stdio\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});