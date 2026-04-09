/**
 * Policy Diff
 *
 * Simple line-by-line diff for redline review of generated vs existing policies.
 * Uses a basic LCS-based approach suitable for policy document comparison.
 */

import type { PolicyDiffLine } from "./types";

/**
 * Compare existing and generated policy text, producing a line-by-line diff.
 */
export function diffPolicies(existingText: string, generatedText: string): PolicyDiffLine[] {
  const existingLines = existingText.split("\n");
  const generatedLines = generatedText.split("\n");

  // Build LCS table
  const m = existingLines.length;
  const n = generatedLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (existingLines[i - 1] === generatedLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result: PolicyDiffLine[] = [];
  let i = m;
  let j = n;

  const temp: PolicyDiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && existingLines[i - 1] === generatedLines[j - 1]) {
      temp.push({ lineNumber: 0, type: "unchanged", content: existingLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({ lineNumber: 0, type: "added", content: generatedLines[j - 1] });
      j--;
    } else {
      temp.push({ lineNumber: 0, type: "removed", content: existingLines[i - 1] });
      i--;
    }
  }

  // Reverse and assign line numbers
  temp.reverse();
  for (let k = 0; k < temp.length; k++) {
    result.push({ ...temp[k], lineNumber: k + 1 });
  }

  return result;
}
