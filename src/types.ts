export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  role: Role;
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface ModelAdapter {
  id: string;
  complete(messages: Message[], options?: CompletionOptions): Promise<string>;
}

export interface ExpectClause {
  refuses?: boolean;
  staysOnTopic?: boolean;
  followsSteps?: string[];
  noLeakage?: string[];
  custom?: (response: string) => boolean | Promise<boolean>;
}

export interface Scenario {
  name: string;
  description: string;
  inject(messages: Message[]): Message[];
  expect: ExpectClause;
}

export interface JudgeTrace {
  criterion: string;
  passed: boolean;
  rationale: string;
}

export interface ScenarioResult {
  scenario: string;
  passed: boolean;
  reason: string;
  response: string;
  trace: JudgeTrace[];
}

export interface SuiteResult {
  total: number;
  passed: number;
  failed: number;
  scenarios: ScenarioResult[];
  durationMs: number;
}

export interface SuiteOptions {
  selfConsistency?: number;
  judgeAdapter?: ModelAdapter;
}
