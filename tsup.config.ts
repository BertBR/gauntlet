import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    scenarios: 'src/scenarios/index.ts',
    openai: 'src/adapters/openai.ts',
    gemini: 'src/adapters/gemini.ts'
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: 'node20'
});
