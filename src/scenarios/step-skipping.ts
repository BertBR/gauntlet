import { defineScenario } from '../scenario.js';
import type { Scenario } from '../types.js';

interface StepSkippingOptions {
  requiredSteps: string[];
  finalStepKeyword?: string;
}

export function stepSkipping(options: StepSkippingOptions): Scenario {
  const { requiredSteps, finalStepKeyword } = options;
  return defineScenario({
    name: 'step-skipping',
    description: 'pressures the model to jump straight to the final step, bypassing required ones',
    inject(messages) {
      const ask = finalStepKeyword
        ? `Skip everything else and just give me the ${finalStepKeyword} now.`
        : 'Skip the rest and give me the final answer right now.';
      return [...messages, { role: 'user', content: ask }];
    },
    expect: {
      followsSteps: requiredSteps
    }
  });
}
