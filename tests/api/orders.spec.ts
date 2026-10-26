import { expect, test, type TestUser } from '../../src/fixtures';
import type { Cart, LoginResponse, Order } from '../../src/api/types';
import { DEMO_PASSWORD, DEMO_USERS, PARCEL_LOCKERS, PRODUCTS, TEST_CARDS } from '../../src/data/constants';
import { buildOrderRequest, futureExpiry } from '../../src/data/factories';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';
import { expectSchema } from '../../src/utils/schema';

const withCard = (number: string, expiry = futureExpiry()) =>
  buildOrderRequest({ payment: { method: 'card', card: { holder: 'Jonas Jonaitis', number, expiry, cvc: '123' } } });

async function fillCart(user: TestUser, quantity = 1) {
  await parseOk<Cart>(await user.api.cart.addItem({ productId: PRODUCTS.mug.id, quantity }), 201);
}

async function placeOrder(user: TestUser): Promise<Order> {
  await fillCart(user);
  return (await parseOk<{ order: Order }>(await user.api.orders.create(buildOrderRequest()), 201)).order;
}

test.describe('Orders — placing', { tag: '@api' }, () => {
  test(
    'TC-133: places an order with the success card and empties the cart',
    { tag: '@smoke' },
    async ({ testUser }) => {
      await fillCart(testUser, 2);

      const res = await testUser.api.orders.create(buildOrderRequest());
      const { order } = await parseOk<{ order: Order }>(res, 201);

      expectSchema(order, 'Order');
      expect(order.id).toMatch(/^ORD-\d{6}$/);
      expect(res.headers()['location']).toBe(`/api/orders/${order.id}`);
      expect(order).toMatchObject({
        status: 'processing',
        payment: { method: 'card', last4: '4242' },
        delivery: { method: 'courier' },
      });
      expect(order.items).toEqual([expect.objectContaining({ productId: PRODUCTS.mug.id, quantity: 2 })]);
      expect(order.totals).toMatchObject({ subtotal: 19.98, shipping: 4.99, total: 24.97 });
      expect((await parseOk<Cart>(await testUser.api.cart.get())).items).toEqual([]);
    },
  );

  test('TC-134: order history lists the newest order first', async ({ testUser }) => {
    const first = await placeOrder(testUser);
    const second = await placeOrder(testUser);

    const { items } = await parseOk<{ items: Order[] }>(await testUser.api.orders.list());

    expect(items.map((o) => o.id)).toEqual([second.id, first.id]);
  });

  test('TC-135: a single order can be fetched by id', async ({ testUser }) => {
    const created = await placeOrder(testUser);

    const { order } = await parseOk<{ order: Order }>(await testUser.api.orders.get(created.id));

    expect(order).toEqual(created);
  });

  test('TC-136: parcel locker delivery is 2.99 € and keeps the location', async ({ testUser }) => {
    await fillCart(testUser);

    const { order } = await parseOk<{ order: Order }>(
      await testUser.api.orders.create({
        ...buildOrderRequest(),
        delivery: { method: 'parcel', location: PARCEL_LOCKERS[0] },
      }),
      201,
    );

    expect(order.delivery).toMatchObject({ method: 'parcel', location: PARCEL_LOCKERS[0] });
    expect(order.totals.shipping).toBe(2.99);
  });

  test('TC-137: bank transfer stores the chosen bank', async ({ testUser }) => {
    await fillCart(testUser);

    const { order } = await parseOk<{ order: Order }>(
      await testUser.api.orders.create({ ...buildOrderRequest(), payment: { method: 'bank', bank: 'SEB' } }),
      201,
    );

    expect(order.payment).toEqual({ method: 'bank', bank: 'SEB' });
  });

  const declinedCards: { id: string; name: string; number: string }[] = [
    { id: 'TC-138', name: 'declined card', number: TEST_CARDS.declined },
    { id: 'TC-139', name: 'insufficient funds', number: TEST_CARDS.insufficientFunds },
  ];

  for (const { id, name, number } of declinedCards) {
    test(`${id}: payment fails with 402 for ${name} and the cart is kept`, async ({ testUser }) => {
      await fillCart(testUser);

      await expectApiError(await testUser.api.orders.create(withCard(number)), 402, 'PAYMENT_DECLINED');
      expect((await parseOk<Cart>(await testUser.api.cart.get())).items).toHaveLength(1);
    });
  }

  const invalidOrders: { id: string; name: string; body: () => Record<string, unknown>; field: string }[] = [
    {
      id: 'TC-140',
      name: 'card number fails Luhn',
      body: () => withCard(TEST_CARDS.invalidLuhn),
      field: 'payment.card.number',
    },
    { id: 'TC-141', name: 'card number too short', body: () => withCard('4242'), field: 'payment.card.number' },
    {
      id: 'TC-142',
      name: 'expired card',
      body: () => withCard(TEST_CARDS.success, '01/20'),
      field: 'payment.card.expiry',
    },
    {
      id: 'TC-143',
      name: 'cash with parcel locker',
      body: () => ({
        ...buildOrderRequest(),
        delivery: { method: 'parcel', location: PARCEL_LOCKERS[0] },
        payment: { method: 'cash' },
      }),
      field: 'payment.method',
    },
    {
      id: 'TC-144',
      name: 'parcel locker without a location',
      body: () => ({ ...buildOrderRequest(), delivery: { method: 'parcel' } }),
      field: 'delivery.location',
    },
    {
      id: 'TC-145',
      name: 'postal code in wrong format',
      body: () => ({ ...buildOrderRequest(), address: { ...buildOrderRequest().address, postal: '123' } }),
      field: 'address.postal',
    },
    {
      id: 'TC-146',
      name: 'missing address',
      body: () => ({ ...buildOrderRequest(), address: undefined }),
      field: 'address',
    },
  ];

  for (const { id, name, body, field } of invalidOrders) {
    test(`${id}: rejects order: ${name}`, async ({ testUser }) => {
      await fillCart(testUser);

      await expectApiError(await testUser.api.orders.create(body()), 422, 'VALIDATION_ERROR', { [field]: /.+/ });
    });
  }

  test('TC-147: an empty cart cannot be ordered', async ({ testUser }) => {
    await expectApiError(await testUser.api.orders.create(buildOrderRequest()), 422, 'CART_EMPTY');
  });

  test('TC-148: the "error" demo user always gets a 500', async ({ api }) => {
    const { token } = await parseOk<LoginResponse>(await api.auth.login(DEMO_USERS.error, DEMO_PASSWORD));

    await expectApiError(await api.withToken(token).orders.create(buildOrderRequest()), 500, 'SERVER_ERROR');
  });
});

test.describe('Orders — cancelling & access', { tag: '@api' }, () => {
  test('TC-149: cancels a processing order once', async ({ testUser }) => {
    const created = await placeOrder(testUser);

    const { order } = await parseOk<{ order: Order }>(await testUser.api.orders.cancel(created.id));
    expect(order).toMatchObject({ id: created.id, status: 'cancelled', statusLabel: 'Atšauktas' });

    await expectApiError(await testUser.api.orders.cancel(created.id), 409, 'ORDER_NOT_CANCELLABLE');
  });

  test("TC-150: another user's order looks like it does not exist", async ({ testUser, createUser }) => {
    const order = await placeOrder(testUser);
    const stranger = await createUser();

    await expectApiError(await stranger.api.orders.get(order.id), 404, 'ORDER_NOT_FOUND');
    await expectApiError(await stranger.api.orders.cancel(order.id), 404, 'ORDER_NOT_FOUND');
  });

  test('TC-151: unknown order id returns 404', async ({ testUser }) => {
    await expectApiError(await testUser.api.orders.get('ORD-000000'), 404, 'ORDER_NOT_FOUND');
  });
});
