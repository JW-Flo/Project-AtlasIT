#!/usr/bin/env node
import { readFileSync } from 'fs';
const system = JSON.parse(readFileSync('mcp/segments/system.json', 'utf-8')).content;
// Support both old and new filename for backwards compatibility
const projectFile = ['mcp/segments/atlasit.json', 'mcp/segments/project-ignite.json']
  .find(f => { try { readFileSync(f); return true; } catch { return false; } });
const project = JSON.parse(readFileSync(projectFile, 'utf-8')).content;
console.log(JSON.stringify({ system, project }));
