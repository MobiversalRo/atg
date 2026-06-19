import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// Integration tests run against the live local Supabase stack. We load .env.local
// (vitest does not do this automatically) so the anon key is available; without it
// the test self-skips. Kept separate from vitest.config.ts so `npm test` stays fast.
export default defineConfig(({ mode }) => ({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    env: loadEnv(mode, process.cwd(), ''),
  },
}));
