import { describe, it, expect } from 'vitest';
import { runControlEval } from '../src/evaluation/engine';

describe('engine', () => {
  it('evaluates SOC2-CC6.2 pass when MFA required', () => {
    const res = runControlEval('SOC2-CC6.2', { type:'mfa.policy.exported', tenant:'t1', occurred_at:new Date().toISOString(), payload:{ mfa_required: true }, trace_id:'x' });
    expect(res.decision).toBe('pass');
  });
});
