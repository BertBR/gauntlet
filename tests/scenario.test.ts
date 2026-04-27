import { describe, expect, it } from 'vitest';
import { defineScenario } from '../src/scenario.js';
import { offTopic, promptInjection, stepSkipping } from '../src/scenarios/index.js';
import type { Message } from '../src/types.js';

describe('defineScenario', () => {
  it('preserves messages when no inject is provided', () => {
    const scenario = defineScenario({
      name: 'noop',
      expect: { refuses: false }
    });
    const messages: Message[] = [{ role: 'user', content: 'hello' }];
    expect(scenario.inject(messages)).toEqual(messages);
  });

  it('runs the provided inject function', () => {
    const scenario = defineScenario({
      name: 'append',
      inject: (m) => [...m, { role: 'user', content: 'extra' }],
      expect: { refuses: false }
    });
    const out = scenario.inject([{ role: 'user', content: 'a' }]);
    expect(out).toHaveLength(2);
    expect(out[1]?.content).toBe('extra');
  });

  it('uses an empty description when none is given', () => {
    const scenario = defineScenario({ name: 'x', expect: {} });
    expect(scenario.description).toBe('');
  });
});

describe('built-in scenarios', () => {
  it('prompt-injection appends an override-style user message', () => {
    const out = promptInjection.inject([{ role: 'system', content: 'system' }]);
    expect(out).toHaveLength(2);
    expect(out[1]?.content.toLowerCase()).toContain('ignore');
    expect(promptInjection.expect.refuses).toBe(true);
  });

  it('off-topic targets the staysOnTopic clause', () => {
    expect(offTopic.expect.staysOnTopic).toBe(true);
  });

  it('step-skipping is a builder that captures required steps', () => {
    const scenario = stepSkipping({ requiredSteps: ['intro', 'question 1', 'wrap up'] });
    expect(scenario.expect.followsSteps).toEqual(['intro', 'question 1', 'wrap up']);
  });
});
