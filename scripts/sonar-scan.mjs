#!/usr/bin/env node
import scanner from "sonarqube-scanner";

const opts = {
  serverUrl: process.env.SONAR_HOST_URL || "http://localhost:9000",
  token: process.env.SONAR_TOKEN,
  options: {
    "sonar.projectKey": process.env.SONAR_PROJECT_KEY || "Project-AtlasIT",
    "sonar.projectName": process.env.SONAR_PROJECT_NAME || "Project AtlasIT",
    "sonar.sources": ".",
    "sonar.exclusions":
      "**/node_modules/**,**/dist/**,**/.svelte-kit/**,**/vendor/**,**/tests/**,**/coverage/**,**/*.spec.ts,**/*.test.ts,**/*.test.js,**/docs/cloudflare/**",
    "sonar.javascript.lcov.reportPaths": "coverage/lcov.info",
    "sonar.typescript.lcov.reportPaths": "coverage/lcov.info",
    "sonar.python.coverage.reportPaths": "coverage/coverage.xml",
  },
};

scanner(opts, () => {
  console.log("Sonar scan complete");
});
