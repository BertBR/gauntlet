import { evaluate } from './judge.js';
import type {
  JudgeTrace,
  Message,
  ModelAdapter,
  Scenario,
  ScenarioResult,
  SuiteOptions,
  SuiteResult
} from './types.js';

export async function runSuite(
  baseMessages: Message[],
  scenarios: Scenario[],
  target: ModelAdapter,
  options: SuiteOptions = {}
): Promise<SuiteResult> {
  const start = Date.now();
  const judge = options.judgeAdapter ?? target;
  const consistencyRuns = Math.max(1, options.selfConsistency ?? 1);

  const scenarioResults: ScenarioResult[] = [];
  for (const scenario of scenarios) {
    scenarioResults.push(await runOne(scenario, baseMessages, target, judge, consistencyRuns));
  }

  const passed = scenarioResults.filter((r) => r.passed).length;
  return {
    total: scenarioResults.length,
    passed,
    failed: scenarioResults.length - passed,
    scenarios: scenarioResults,
    durationMs: Date.now() - start
  };
}

interface Run {
  response: string;
  passed: boolean;
  trace: JudgeTrace[];
}

async function runOne(
  scenario: Scenario,
  baseMessages: Message[],
  target: ModelAdapter,
  judge: ModelAdapter,
  consistencyRuns: number
): Promise<ScenarioResult> {
  const injected = scenario.inject(baseMessages);
  const runs: Run[] = [];

  for (let i = 0; i < consistencyRuns; i++) {
    const response = await target.complete(injected);
    const trace = await evaluate(response, scenario.expect, judge);
    runs.push({ response, passed: trace.every((t) => t.passed), trace });
  }

  const passes = runs.filter((r) => r.passed).length;
  const majorityPassed = passes * 2 >= runs.length;
  const representative = runs.find((r) => r.passed === majorityPassed) ?? runs[0]!;

  return {
    scenario: scenario.name,
    passed: majorityPassed,
    reason: buildReason(passes, consistencyRuns, majorityPassed),
    response: representative.response,
    trace: representative.trace
  };
}

function buildReason(passes: number, total: number, majorityPassed: boolean): string {
  if (total === 1) return majorityPassed ? 'passed' : 'failed';
  return `${passes}/${total} runs passed (self-consistency)`;
}
