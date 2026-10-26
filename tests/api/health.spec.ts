import { expect, test } from '../../src/fixtures';
import { FREE_SHIPPING_FROM, SHIPPING } from '../../src/data/constants';
import { parseOk } from '../../src/utils/api-assertions';

test.describe('Health & config', { tag: '@api' }, () => {
  test('TC-001: GET /health reports ok', { tag: '@smoke' }, async ({ api }) => {
    const body = await parseOk<{ status: string; time: string }>(await api.misc.health());

    expect(body.status).toBe('ok');
    expect(Date.parse(body.time)).not.toBeNaN();
  });

  test('TC-002: GET /config exposes shipping rules', { tag: '@smoke' }, async ({ api }) => {
    const config = await parseOk<{ freeShippingFrom: number; shipping: Record<string, { price: number }> }>(
      await api.misc.config(),
    );

    expect(config.freeShippingFrom).toBe(FREE_SHIPPING_FROM);
    expect(config.shipping.courier.price).toBe(SHIPPING.courier.price);
    expect(config.shipping.parcel.price).toBe(SHIPPING.parcel.price);
    expect(config.shipping.pickup.price).toBe(SHIPPING.pickup.price);
  });

  test('TC-003: unknown route returns 404 NOT_FOUND', async ({ apiContext }) => {
    const res = await apiContext.get('does-not-exist');

    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('NOT_FOUND');
  });
});
