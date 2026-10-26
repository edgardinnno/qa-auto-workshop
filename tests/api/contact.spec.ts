import { expect, test } from '../../src/fixtures';
import { buildContactMessage } from '../../src/data/factories';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';

test.describe('Contact messages', { tag: '@api' }, () => {
  test('accepts a valid message and returns a ticket number', async ({ api }) => {
    const { ticket } = await parseOk<{ ticket: string }>(await api.misc.sendContactMessage(buildContactMessage()), 201);

    expect(ticket).toMatch(/^KT-\d{4}$/);
  });

  test('accepts an optional order number', async ({ api }) => {
    const res = await api.misc.sendContactMessage(buildContactMessage({ topic: 'order', orderNumber: 'ORD-123456' }));

    expect(res.status()).toBe(201);
  });

  const invalidCases: { name: string; overrides: Record<string, unknown>; field: string }[] = [
    { name: 'name too short', overrides: { name: 'J' }, field: 'name' },
    { name: 'malformed email', overrides: { email: 'jonas@' }, field: 'email' },
    { name: 'unknown topic', overrides: { topic: 'complaint' }, field: 'topic' },
    { name: 'order number in wrong format', overrides: { orderNumber: '123456' }, field: 'orderNumber' },
    { name: 'message under 20 chars', overrides: { message: 'Per trumpa.' }, field: 'message' },
    { name: 'message over 500 chars', overrides: { message: 'a'.repeat(501) }, field: 'message' },
  ];

  for (const { name, overrides, field } of invalidCases) {
    test(`rejects: ${name}`, async ({ api }) => {
      const res = await api.misc.sendContactMessage({ ...buildContactMessage(), ...overrides });

      await expectApiError(res, 422, 'VALIDATION_ERROR', { [field]: /.+/ });
    });
  }
});
