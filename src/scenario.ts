import type { ExpectClause, Message, Scenario } from './types.js';

interface DefineScenarioInput {
  name: string;
  description?: string;
  inject?: (messages: Message[]) => Message[];
  expect: ExpectClause;
}

export function defineScenario(input: DefineScenarioInput): Scenario {
  return {
    name: input.name,
    description: input.description ?? '',
    inject: input.inject ?? ((m) => m),
    expect: input.expect
  };
}
