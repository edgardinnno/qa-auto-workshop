import { test } from '../../src/fixtures';
import { expectApiError } from '../../src/utils/api-assertions';

/** Every endpoint marked 🔒 in the API docs. */
const PROTECTED_ENDPOINTS: { noTokenId: string; badTokenId: string; method: string; path: string }[] = [
  { noTokenId: 'TC-026', badTokenId: 'TC-027', method: 'POST', path: 'auth/logout' },
  { noTokenId: 'TC-028', badTokenId: 'TC-029', method: 'GET', path: 'users/me' },
  { noTokenId: 'TC-030', badTokenId: 'TC-031', method: 'PATCH', path: 'users/me' },
  { noTokenId: 'TC-032', badTokenId: 'TC-033', method: 'DELETE', path: 'users/me' },
  { noTokenId: 'TC-034', badTokenId: 'TC-035', method: 'PUT', path: 'users/me/password' },
  { noTokenId: 'TC-036', badTokenId: 'TC-037', method: 'POST', path: 'products/p11/reviews' },
  { noTokenId: 'TC-038', badTokenId: 'TC-039', method: 'GET', path: 'cart' },
  { noTokenId: 'TC-040', badTokenId: 'TC-041', method: 'DELETE', path: 'cart' },
  { noTokenId: 'TC-042', badTokenId: 'TC-043', method: 'POST', path: 'cart/items' },
  { noTokenId: 'TC-044', badTokenId: 'TC-045', method: 'PATCH', path: 'cart/items/1' },
  { noTokenId: 'TC-046', badTokenId: 'TC-047', method: 'DELETE', path: 'cart/items/1' },
  { noTokenId: 'TC-048', badTokenId: 'TC-049', method: 'POST', path: 'cart/promo' },
  { noTokenId: 'TC-050', badTokenId: 'TC-051', method: 'DELETE', path: 'cart/promo' },
  { noTokenId: 'TC-052', badTokenId: 'TC-053', method: 'GET', path: 'orders' },
  { noTokenId: 'TC-054', badTokenId: 'TC-055', method: 'POST', path: 'orders' },
  { noTokenId: 'TC-056', badTokenId: 'TC-057', method: 'GET', path: 'orders/ORD-000000' },
  { noTokenId: 'TC-058', badTokenId: 'TC-059', method: 'POST', path: 'orders/ORD-000000/cancel' },
];

test.describe('Auth guard', { tag: '@api' }, () => {
  for (const { noTokenId, badTokenId, method, path } of PROTECTED_ENDPOINTS) {
    test(`${noTokenId}: ${method} /${path} without a token → 401`, async ({ apiContext }) => {
      const res = await apiContext.fetch(path, { method, data: {} });

      await expectApiError(res, 401, 'UNAUTHORIZED');
    });

    test(`${badTokenId}: ${method} /${path} with an invalid token → 401`, async ({ apiContext }) => {
      const res = await apiContext.fetch(path, {
        method,
        data: {},
        headers: { Authorization: 'Bearer not-a-real-token' },
      });

      await expectApiError(res, 401, 'INVALID_TOKEN');
    });
  }
});
