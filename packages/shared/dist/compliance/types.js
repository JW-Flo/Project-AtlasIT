export function deriveRiskScore(likelihood, impact) {
    return likelihood * impact;
}
export function deriveSeverity(score) {
    if (score <= 5)
        return "low";
    if (score <= 10)
        return "medium";
    if (score <= 16)
        return "high";
    return "critical";
}
//# sourceMappingURL=types.js.map