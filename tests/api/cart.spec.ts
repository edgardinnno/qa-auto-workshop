import { expect, test, type TestUser } from '../../src/fixtures';
import type { Cart } from '../../src/api/types';
import { FREE_SHIPPING_FROM, PRODUCTS, PROMO_CODES, SHIPPING } from '../../src/data/constants';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';
import { expectSchema } from '../../src/utils/schema';

test.describe('Cart — items', { tag: '@api' }, () => {
  test('a new user starts with an empty cart', async ({ testUser }) => {
    const cart = await parseOk<Cart>(await testUser.api.cart.get());

    expectSchema(cart, 'Cart');
    expect(cart).toMatchObject({ items: [], itemCount: 0, promo: null });
    expect(cart.totals).toMatchObject({ subtotal: 0, shipping: 0, total: 0 });
  });

  test('adds an item', { tag: '@smoke' }, async ({ testUser }) => {
    const cart = await parseOk<Cart>(await testUser.api.cart.addItem({ productId: PRODUCTS.mug.id, quantity: 2 }), 201);

    expectSchema(cart, 'Cart');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ productId: PRODUCTS.mug.id, quantity: 2, lineTotal: 19.98 });
    expect(cart.itemCount).toBe(2);
  });

  test('adding the same variant again sums the quantity on one line', async ({ testUser }) => {
    await testUser.api.cart.addItem({ productId: PRODUCTS.mug.id, quantity: 1 });
    const cart = await parseOk<Cart>(await testUser.api.cart.addItem({ productId: PRODUCTS.mug.id, quantity: 2 }), 201);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
  });

  test('different variants of one product are separate lines', async ({ testUser }) => {
    const [black, white] = PRODUCTS.headphones.colors;
    await testUser.api.cart.addItem({ productId: PRODUCTS.headphones.id, color: black });
    const cart = await parseOk<Cart>(
      await testUser.api.cart.addItem({ productId: PRODUCTS.headphones.id, color: white }),
      201,
    );

    expect(cart.items.map((i) => i.color)).toEqual([black, white]);
  });

  test('a product with sizes requires a size', async ({ testUser }) => {
    const res = await testUser.api.cart.addItem({ productId: PRODUCTS.tShirt.id, color: PRODUCTS.tShirt.colors[0] });

    await expectApiError(res, 422, 'VALIDATION_ERROR', { size: /dydį/ });
  });

  test('an unknown colour is rejected', async ({ testUser }) => {
    const res = await testUser.api.cart.addItem({ productId: PRODUCTS.headphones.id, color: 'Raudona' });

    await expectApiError(res, 422, 'VALIDATION_ERROR', { color: /Galimos spalvos/ });
  });

  test('quantity must be between 1 and 99', async ({ testUser }) => {
    await expectApiError(
      await testUser.api.cart.addItem({ productId: PRODUCTS.mug.id, quantity: 100 }),
      422,
      'VALIDATION_ERROR',
      { quantity: /1 iki 99/ },
    );
  });

  test('a sold-out product cannot be added', async ({ testUser }) => {
    await expectApiError(await testUser.api.cart.addItem({ productId: PRODUCTS.speaker.id }), 409, 'OUT_OF_STOCK');
  });

  test('cannot add more than the stock, counting what is already in the cart', async ({ testUser }) => {
    await parseOk<Cart>(
      await testUser.api.cart.addItem({ productId: PRODUCTS.keyboard.id, quantity: PRODUCTS.keyboard.stock }),
      201,
    );

    await expectApiError(await testUser.api.cart.addItem({ productId: PRODUCTS.keyboard.id }), 409, 'OUT_OF_STOCK');
  });

  test('an unknown product returns 404', async ({ testUser }) => {
    await expectApiError(await testUser.api.cart.addItem({ productId: 'p999' }), 404, 'PRODUCT_NOT_FOUND');
  });

  test('updates the quantity of a line', async ({ testUser }) => {
    const { items } = await parseOk<Cart>(await testUser.api.cart.addItem({ productId: PRODUCTS.mug.id }), 201);

    const cart = await parseOk<Cart>(await testUser.api.cart.updateItem(items[0].id, 5));

    expect(cart.items[0].quantity).toBe(5);
  });

  test('updating above the stock is rejected', async ({ testUser }) => {
    const { items } = await parseOk<Cart>(await testUser.api.cart.addItem({ productId: PRODUCTS.keyboard.id }), 201);

    await expectApiError(
      await testUser.api.cart.updateItem(items[0].id, PRODUCTS.keyboard.stock + 1),
      409,
      'OUT_OF_STOCK',
    );
  });

  test('removes a line, and the promo is dropped when the cart becomes empty', async ({ testUser }) => {
    const { items } = await parseOk<Cart>(await testUser.api.cart.addItem({ productId: PRODUCTS.mug.id }), 201);
    await parseOk<Cart>(await testUser.api.cart.applyPromo(PROMO_CODES.percent10));

    const cart = await parseOk<Cart>(await testUser.api.cart.removeItem(items[0].id));

    expect(cart.items).toEqual([]);
    expect(cart.promo).toBeNull();
  });

  test('DELETE /cart empties it', async ({ testUser }) => {
    await testUser.api.cart.addItem({ productId: PRODUCTS.mug.id });

    expect((await testUser.api.cart.clear()).status()).toBe(204);
    expect((await parseOk<Cart>(await testUser.api.cart.get())).items).toEqual([]);
  });

  test("a user cannot modify another user's cart line", async ({ testUser, createUser }) => {
    const other = await createUser();
    const { items } = await parseOk<Cart>(await other.api.cart.addItem({ productId: PRODUCTS.mug.id }), 201);

    await expectApiError(await testUser.api.cart.updateItem(items[0].id, 2), 404, 'CART_ITEM_NOT_FOUND');
    await expectApiError(await testUser.api.cart.removeItem(items[0].id), 404, 'CART_ITEM_NOT_FOUND');
  });
});

test.describe('Cart — totals & promo codes', { tag: '@api' }, () => {
  const mug = PRODUCTS.mug;

  async function arrangeCart(user: TestUser, quantity: number, promo?: string) {
    await parseOk<Cart>(await user.api.cart.addItem({ productId: mug.id, quantity }), 201);
    if (promo) await parseOk<Cart>(await user.api.cart.applyPromo(promo));
  }

  const totalsCases: {
    name: string;
    quantity: number;
    promo?: string;
    expected: { subtotal: number; discount: number; shipping: number; total: number };
  }[] = [
    {
      name: 'courier shipping below the free-shipping threshold',
      quantity: 1,
      expected: { subtotal: 9.99, discount: 0, shipping: SHIPPING.courier.price, total: 14.98 },
    },
    {
      name: 'free shipping at ≥ 50 €',
      quantity: 6,
      expected: { subtotal: 59.94, discount: 0, shipping: 0, total: 59.94 },
    },
    {
      name: 'PLAYWRIGHT10 takes 10 % off the subtotal',
      quantity: 1,
      promo: PROMO_CODES.percent10,
      expected: { subtotal: 9.99, discount: 1, shipping: SHIPPING.courier.price, total: 13.98 },
    },
    {
      name: 'NEMOKAMAS removes shipping',
      quantity: 1,
      promo: PROMO_CODES.freeShipping,
      expected: { subtotal: 9.99, discount: 0, shipping: 0, total: 9.99 },
    },
    {
      name: 'the free-shipping threshold is checked after the discount',
      quantity: 6,
      promo: PROMO_CODES.percent10,
      expected: { subtotal: 59.94, discount: 5.99, shipping: 0, total: 53.95 },
    },
  ];

  for (const { name, quantity, promo, expected } of totalsCases) {
    test(`totals: ${name}`, async ({ testUser }) => {
      await arrangeCart(testUser, quantity, promo);

      const { totals } = await parseOk<Cart>(await testUser.api.cart.get());

      expect(totals).toMatchObject(expected);
      expect(totals.freeShippingLeft).toBe(
        Math.max(0, Math.round((FREE_SHIPPING_FROM - totals.subtotal + totals.discount) * 100) / 100),
      );
      expect(totals.vat).toBeCloseTo(totals.total - totals.total / 1.21, 2);
    });
  }

  test('DIDELIS20 applies 20 % once the subtotal reaches 100 €', async ({ testUser }) => {
    await testUser.api.cart.addItem({ productId: PRODUCTS.keyboard.id });

    const { totals, promo } = await parseOk<Cart>(await testUser.api.cart.applyPromo(PROMO_CODES.percent20Min100));

    expect(promo?.code).toBe('DIDELIS20');
    expect(totals).toMatchObject({ subtotal: 109, discount: 21.8, shipping: 0, total: 87.2 });
  });

  test('DIDELIS20 is rejected below 100 €', async ({ testUser }) => {
    await testUser.api.cart.addItem({ productId: mug.id });

    await expectApiError(await testUser.api.cart.applyPromo(PROMO_CODES.percent20Min100), 422, 'PROMO_MIN_AMOUNT');
  });

  test('applying the same code twice → 409', async ({ testUser }) => {
    await testUser.api.cart.addItem({ productId: mug.id });
    await parseOk<Cart>(await testUser.api.cart.applyPromo(PROMO_CODES.percent10));

    await expectApiError(await testUser.api.cart.applyPromo(PROMO_CODES.percent10), 409, 'PROMO_ALREADY_APPLIED');
  });

  test('a promo cannot be applied to an empty cart', async ({ testUser }) => {
    await expectApiError(await testUser.api.cart.applyPromo(PROMO_CODES.percent10), 422, 'CART_EMPTY');
  });

  test('removing the promo restores the original total', async ({ testUser }) => {
    await testUser.api.cart.addItem({ productId: mug.id });
    await testUser.api.cart.applyPromo(PROMO_CODES.percent10);

    const cart = await parseOk<Cart>(await testUser.api.cart.removePromo());

    expect(cart.promo).toBeNull();
    expect(cart.totals).toMatchObject({ discount: 0, total: 14.98 });
  });
});
