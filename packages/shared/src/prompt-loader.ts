/**
 * Prompt loader with Handlebars templates and chokidar hot-reload
 */

import Handlebars from 'handlebars';
import { watch, type FSWatcher } from 'chokidar';
import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import type { PromptVariables } from './types.js';

export class PromptLoader {
  private templates = new Map<string, HandlebarsTemplateDelegate>();
  private watcher: FSWatcher | null = null;

  constructor(private promptDir: string) {}

  async initialize(): Promise<void> {
    // Initial load: read all .md files from promptDir
    const files = await readdir(this.promptDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        await this.loadPrompt(file);
      }
    }

    // Start chokidar watcher for hot-reload
    this.watcher = watch(this.promptDir, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    });

    this.watcher.on('change', async (filePath: string) => {
      if (filePath.endsWith('.md')) {
        const fileName = basename(filePath);
        console.error(`[prompt-loader] Reloaded: ${fileName}`);
        await this.loadPrompt(fileName);
      }
    });
  }

  private async loadPrompt(filename: string): Promise<void> {
    const fullPath = join(this.promptDir, filename);
    const content = await readFile(fullPath, 'utf8');
    const template = Handlebars.compile(content);
    const templateName = basename(filename, '.md');
    this.templates.set(templateName, template);
  }

  render(name: string, variables: PromptVariables): string {
    const template = this.templates.get(name);
    if (!template) {
      const available = Array.from(this.templates.keys()).join(', ');
      throw new Error(
        `Prompt template "${name}" not found. Available templates: ${available || '(none)'}`
      );
    }
    return template(variables);
  }

  has(name: string): boolean {
    return this.templates.has(name);
  }

  async close(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }
}
