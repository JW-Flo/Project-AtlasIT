import js from "@eslint/js";

export default [
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    ignores: [
      "./node_modules/**",
      "./.venv/**",
      "./dist/**",
      "./build/**",
      "./agents/utils/**",
      "./mcp-mobile/**"
    ],
    rules: {
      // Customize project-specific rules here
      "no-unused-vars": "warn",
    },
  },
]; 