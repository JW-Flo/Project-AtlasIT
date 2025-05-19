import { BaseAgent } from './base_agent.js';
import { promises as fs } from 'fs';
import path from 'path';

export class FilesystemAgent extends BaseAgent {
  constructor(ctx, env) {
    super(ctx, env);
    this.name = 'filesystem-agent';
    this.version = '1.0.0';
  }

  async init() {
    await super.init();
    // Register filesystem-specific capabilities
    this.registerCapabilities({
      tools: ['read', 'write', 'execute', 'list', 'create', 'delete'],
      resources: ['file', 'directory'],
      prompts: ['filesystem']
    });
  }

  // Override base tool implementations with filesystem-specific ones
  async handleRead(args) {
    const { path: filePath } = args;
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleWrite(args) {
    const { path: filePath, content } = args;
    try {
      await fs.writeFile(filePath, content, 'utf8');
      return { success: true, data: 'File written successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleExecute(args) {
    const { command } = args;
    try {
      // Implement command execution logic here
      return { success: true, data: `Executed command: ${command}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Add filesystem-specific tools
  async handleList(args) {
    const { path: dirPath } = args;
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items = entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        path: path.join(dirPath, entry.name)
      }));
      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleCreate(args) {
    const { path: filePath, type, content } = args;
    try {
      if (type === 'directory') {
        await fs.mkdir(filePath, { recursive: true });
      } else {
        await fs.writeFile(filePath, content || '', 'utf8');
      }
      return { success: true, data: `${type} created successfully` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleDelete(args) {
    const { path: targetPath } = args;
    try {
      const stats = await fs.stat(targetPath);
      if (stats.isDirectory()) {
        await fs.rmdir(targetPath, { recursive: true });
      } else {
        await fs.unlink(targetPath);
      }
      return { success: true, data: 'Item deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Override resource implementations
  async readFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async readDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items = entries.map(entry => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        path: path.join(dirPath, entry.name)
      }));
      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
} 