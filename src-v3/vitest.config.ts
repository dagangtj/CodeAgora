import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    poolMatchGlobs: [
      ['**/e2e-*.test.ts', 'forks'],
    ],
  },
});
