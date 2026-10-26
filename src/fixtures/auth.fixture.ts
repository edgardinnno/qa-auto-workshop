import type { TestUser } from './api.fixture';
import { test as apiTest } from './api.fixture';
import { env } from '../config/env';

export interface AuthFixtures {
  /** Dismiss the cookie banner up-front by pre-setting consent. Set to `false` to test the banner itself. */
  cookieConsent: boolean;
  /**
   * Logs the browser in as `testUser` without touching the login form:
   * sets the `qa_session` cookie (token) and `localStorage.qa_user` before any page loads.
   */
  loggedInUser: TestUser;
}

export const test = apiTest.extend<AuthFixtures>({
  cookieConsent: [true, { option: true }],

  context: async ({ context, cookieConsent }, use) => {
    if (cookieConsent) {
      await context.addInitScript(() => localStorage.setItem('qa_cookie_consent', 'all'));
    }
    await use(context);
  },

  loggedInUser: async ({ context, testUser }, use) => {
    await context.addCookies([{ name: 'qa_session', value: testUser.token, url: new URL(env.baseUrl).origin }]);
    await context.addInitScript((user) => {
      // Only seed the cached user once, so logout (which clears it) is respected on later navigations.
      if (!sessionStorage.getItem('qa_seeded')) {
        localStorage.setItem('qa_user', JSON.stringify(user));
        sessionStorage.setItem('qa_seeded', '1');
      }
    }, testUser.user);
    await use(testUser);
  },
});
