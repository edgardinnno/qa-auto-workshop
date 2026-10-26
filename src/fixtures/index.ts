import { mergeTests } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { test as pagesTest } from './pages.fixture';

/**
 * The only `test` specs should import:
 *   import { test, expect } from '../../src/fixtures';
 *
 * Fixtures available: api, apiContext, testUser, createUser, loggedInUser, cookieConsent,
 * and one page object per page (catalogPage, cartPage, …).
 */
export const test = mergeTests(authTest, pagesTest);
export { expect } from '@playwright/test';
export type { TestUser } from './api.fixture';
