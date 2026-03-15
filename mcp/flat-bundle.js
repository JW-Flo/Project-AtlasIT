#!/usr/bin/env node
import { readFileSync } from "fs";
const system = JSON.parse(
  readFileSync("mcp/segments/system.json", "utf-8"),
).content;
// Support both old and new filename for backwards compatibility
const project = JSON.parse(
  readFileSync("mcp/segments/atlasit.json", "utf-8"),
).content;
console.log(JSON.stringify({ system, project }));
