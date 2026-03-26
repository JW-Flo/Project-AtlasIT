# TS Edge Generation – First-Principles

* Derive from fundamentals—don’t cargo-cult.  
* Sketch algorithmic complexity in comments (`// O(n log n)`).

Generation Checklist
1. Validate all req fields → typed `zod` schema.  
2. Authorize via `Bearer $PROMETHEUS_SECRET` (if route mutates).  
3. Handle failure early (`if (!ok) return Response.json(err, { status: 4xx })`).  
4. Emit metrics & structured log.  
5. Add TODO:cost line if external AI/model call made.

Always output a paired `*.spec.ts` that mocks D1/R2 and asserts invariants.
