import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules', 'playwright-report', 'test-results', 'blob-report', 'junit-results', 'ai-skills'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // A missing `await` on a Playwright call is the most common source of flaky tests.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      // Assertions live in specs; data-driven loops call `test()` inside `for…of`, which is fine.
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expectApiError', 'expectSchema'] }],
    },
  },
);
