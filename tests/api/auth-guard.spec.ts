import { test } from '../../src/fixtures';
import { expectApiError } from '../../src/utils/api-assertions';

/** Every endpoint marked 🔒 in the API docs. */
const PROTECTED_ENDPOINTS: { method: string; path: string }[] = [
  { method: 'POST', path: 'auth/logout' },
  { method: 'GET', path: 'users/me' },
  { method: 'PATCH', path: 'users/me' },
  { method: 'DELETE', path: 'users/me' },
  { method: 'PUT', path: 'users/me/password' },
  { method: 'POST', path: 'products/p11/reviews' },
  { method: 'GET', path: 'cart' },
  { method: 'DELETE', path: 'cart' },
  { method: 'POST', path: 'cart/items' },
  { method: 'PATCH', path: 'cart/items/1' },
  { method: 'DELETE', path: 'cart/items/1' },
  { method: 'POST', path: 'cart/promo' },
  { method: 'DELETE', path: 'cart/promo' },
  { method: 'GET', path: 'orders' },
  { method: 'POST', path: 'orders' },
  { method: 'GET', path: 'orders/ORD-000000' },
  { method: 'POST', path: 'orders/ORD-000000/cancel' },
];

test.describe('Auth guard', { tag: '@api' }, () => {
  for (const { method, path } of PROTECTED_ENDPOINTS) {
    test(`${method} /${path} without a token → 401`, async ({ apiContext }) => {
      const res = await apiContext.fetch(path, { method, data: {} });

      await expectApiError(res, 401, 'UNAUTHORIZED');
    });

    test(`${method} /${path} with an invalid token → 401`, async ({ apiContext }) => {
      const res = await apiContext.fetch(path, {
        method,
        data: {},
        headers: { Authorization: 'Bearer not-a-real-token' },
      });

      await expectApiError(res, 401, 'INVALID_TOKEN');
    });
  }
});
