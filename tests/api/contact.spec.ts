import { expect, test } from '../../src/fixtures';
import { buildContactMessage } from '../../src/data/factories';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';

test.describe('Contact messages', { tag: '@api' }, () => {
  test('TC-159: accepts a valid message and returns a ticket number', async ({ api }) => {
    const { ticket } = await parseOk<{ ticket: string }>(await api.misc.sendContactMessage(buildContactMessage()), 201);

    expect(ticket).toMatch(/^KT-\d{4}$/);
  });

  test('TC-160: accepts an optional order number', async ({ api }) => {
    const res = await api.misc.sendContactMessage(buildContactMessage({ topic: 'order', orderNumber: 'ORD-123456' }));

    expect(res.status()).toBe(201);
  });

  const invalidCases: { id: string; name: string; overrides: Record<string, unknown>; field: string }[] = [
    { id: 'TC-161', name: 'name too short', overrides: { name: 'J' }, field: 'name' },
    { id: 'TC-162', name: 'malformed email', overrides: { email: 'jonas@' }, field: 'email' },
    { id: 'TC-163', name: 'unknown topic', overrides: { topic: 'complaint' }, field: 'topic' },
    { id: 'TC-164', name: 'order number in wrong format', overrides: { orderNumber: '123456' }, field: 'orderNumber' },
    { id: 'TC-165', name: 'message under 20 chars', overrides: { message: 'Per trumpa.' }, field: 'message' },
    { id: 'TC-166', name: 'message over 500 chars', overrides: { message: 'a'.repeat(501) }, field: 'message' },
  ];

  for (const { id, name, overrides, field } of invalidCases) {
    test(`${id}: rejects: ${name}`, async ({ api }) => {
      const res = await api.misc.sendContactMessage({ ...buildContactMessage(), ...overrides });

      await expectApiError(res, 422, 'VALIDATION_ERROR', { [field]: /.+/ });
    });
  }
});
