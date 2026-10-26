import { test as base, type APIRequestContext } from '@playwright/test';
import { ApiClient } from '../api/ApiClient';
import type { LoginResponse, RegisterRequest, User } from '../api/types';
import { env } from '../config/env';
import { buildUser } from '../data/factories';
import { parseOk } from '../utils/api-assertions';

export interface TestUser {
  /** The registration payload, including the plain-text password. */
  data: RegisterRequest;
  user: User;
  token: string;
  /** API client already authenticated as this user. */
  api: ApiClient;
}

export interface ApiFixtures {
  /** Request context bound to the API base URL — works in both the `api` and `e2e-*` projects. */
  apiContext: APIRequestContext;
  /** Anonymous API client. */
  api: ApiClient;
  /**
   * A brand-new user registered through the API for this test only.
   * Deleted in teardown (`DELETE /users/me`), even when the test fails.
   */
  testUser: TestUser;
  /** Factory for extra users in multi-user tests; all are cleaned up after the test. */
  createUser: (overrides?: Partial<RegisterRequest>) => Promise<TestUser>;
}

export const test = base.extend<ApiFixtures>({
  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ baseURL: env.apiUrl });
    await use(context);
    await context.dispose();
  },

  api: async ({ apiContext }, use) => {
    await use(new ApiClient(apiContext));
  },

  createUser: async ({ api }, use) => {
    const created: TestUser[] = [];

    await use(async (overrides = {}) => {
      const data = buildUser(overrides);
      await parseOk(await api.auth.register(data), 201);
      const { token, user } = await parseOk<LoginResponse>(await api.auth.login(data.email, data.password));
      const testUser = { data, user, token, api: api.withToken(token) };
      created.push(testUser);
      return testUser;
    });

    for (const { api: authed } of created) {
      // 401 is fine: the test may have deleted the account or logged out already.
      const res = await authed.users.deleteMe();
      if (![204, 401].includes(res.status())) {
        console.warn(`Cleanup failed for test user: ${res.status()} ${await res.text()}`);
      }
    }
  },

  testUser: async ({ createUser }, use) => {
    await use(await createUser());
  },
});
