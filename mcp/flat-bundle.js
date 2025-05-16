#!/usr/bin/env node
import { readFileSync } from 'fs';
const system = JSON.parse(readFileSync('mcp/segments/system.json', 'utf-8')).content;
const project = JSON.parse(readFileSync('mcp/segments/project-ignite.json', 'utf-8')).content;
console.log(JSON.stringify({ system, project }));
