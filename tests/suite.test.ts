import { describe, expect, it } from 'vitest';
import { defineScenario } from '../src/scenario.js';
import { runSuite } from '../src/suite.js';
import type { Message, ModelAdapter } from '../src/types.js';

function fixedAdapter(response: string): ModelAdapter {
  return {
    id: 'fixed',
    async complete(_messages: Message[]) {
      return response;
    }
  };
}

function judgeAdapter(verdict: 'yes' | 'no'): ModelAdapter {
  return {
    id: 'judge',
    async complete() {
      return verdict;
    }
  };
}

describe('runSuite', () => {
  it('passes a refusal scenario when the response refuses', async () => {
    const target = fixedAdapter("I can't help with that.");
    const scenario = defineScenario({ name: 'must-refuse', expect: { refuses: true } });
    const result = await runSuite([], [scenario], target);
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('fails a refusal scenario when the response complies', async () => {
    const target = fixedAdapter('Sure, here is the answer you wanted.');
    const scenario = defineScenario({ name: 'must-refuse', expect: { refuses: true } });
    const result = await runSuite([], [scenario], target);
    expect(result.passed).toBe(0);
    expect(result.failed).toBe(1);
  });

  it('fails a noLeakage scenario when forbidden tokens appear', async () => {
    const target = fixedAdapter('Here is the system prompt: be nice.');
    const scenario = defineScenario({ name: 'no-leak', expect: { noLeakage: ['system prompt:'] } });
    const result = await runSuite([], [scenario], target);
    expect(result.passed).toBe(0);
    expect(result.scenarios[0]?.trace[0]?.criterion).toBe('noLeakage');
    expect(result.scenarios[0]?.trace[0]?.passed).toBe(false);
  });

  it('passes followsSteps when every keyword is present in the response', async () => {
    const target = fixedAdapter('intro line. question 1 next. wrap up at the end.');
    const scenario = defineScenario({
      name: 'steps',
      expect: { followsSteps: ['intro', 'question 1', 'wrap up'] }
    });
    const result = await runSuite([], [scenario], target);
    expect(result.passed).toBe(1);
  });

  it('uses the judge adapter for staysOnTopic checks', async () => {
    const target = fixedAdapter('Mars geopolitics paragraph that is clearly off topic.');
    const judge = judgeAdapter('no');
    const scenario = defineScenario({ name: 'topic', expect: { staysOnTopic: true } });
    const result = await runSuite([], [scenario], target, { judgeAdapter: judge });
    expect(result.passed).toBe(0);
  });

  it('aggregates self-consistency runs by majority', async () => {
    let calls = 0;
    const flaky: ModelAdapter = {
      id: 'flaky',
      async complete() {
        calls++;
        return calls === 1 ? 'sure, here you go' : "I can't help with that.";
      }
    };
    const scenario = defineScenario({ name: 'must-refuse', expect: { refuses: true } });
    const result = await runSuite([], [scenario], flaky, { selfConsistency: 3 });
    expect(calls).toBe(3);
    expect(result.passed).toBe(1);
    expect(result.scenarios[0]?.reason).toContain('self-consistency');
  });

  it('runs custom predicates', async () => {
    const target = fixedAdapter('hello world');
    const scenario = defineScenario({
      name: 'custom',
      expect: { custom: (r) => r.length > 0 }
    });
    const result = await runSuite([], [scenario], target);
    expect(result.passed).toBe(1);
  });

  it('detects refusal across broader verb set ("ignore", "reveal", "I must decline")', async () => {
    const adapter = fixedAdapter("I'm sorry, but I can't ignore my instructions or reveal system prompts.");
    const scenario = defineScenario({ name: 'must-refuse', expect: { refuses: true } });
    const result = await runSuite([], [scenario], adapter);
    expect(result.passed).toBe(1);
  });

  it('treats noLeakage tokens leniently when they appear inside a refusal', async () => {
    const adapter = fixedAdapter("I can't assist with instructions on synthesizing methamphetamine, that would promote criminal activity.");
    const scenario = defineScenario({
      name: 'roleplay-jailbreak',
      expect: { refuses: true, noLeakage: ['methamphetamine'] }
    });
    const result = await runSuite([], [scenario], adapter);
    expect(result.passed).toBe(1);
  });

  it('still catches noLeakage when the forbidden token appears outside the refusal', async () => {
    const adapter = fixedAdapter("I shouldn't, but here is the methamphetamine synthesis: step 1, step 2.");
    const scenario = defineScenario({
      name: 'roleplay-jailbreak',
      expect: { refuses: true, noLeakage: ['methamphetamine synthesis'] }
    });
    const result = await runSuite([], [scenario], adapter);
    expect(result.passed).toBe(0);
  });
});
