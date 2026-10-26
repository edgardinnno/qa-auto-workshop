import { expect, test } from '../../src/fixtures';
import type { Cart } from '../../src/api/types';
import { PRODUCTS, PROMO_CODES } from '../../src/data/constants';
import { parseOk } from '../../src/utils/api-assertions';

const { mug, lamp } = PRODUCTS;

test.describe('Cart', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ loggedInUser, cartPage }) => {
    await parseOk(await loggedInUser.api.cart.addItem({ productId: mug.id }), 201);
    await parseOk(await loggedInUser.api.cart.addItem({ productId: lamp.id }), 201);
    await cartPage.goto();
  });

  test('shows the items and totals from the server', { tag: '@smoke' }, async ({ cartPage }) => {
    await expect(cartPage.items).toHaveCount(2);
    await expect(cartPage.itemsCount).toHaveText('2 prekės');
    await expect(cartPage.subtotal).toHaveText('44,89 €');
    await expect(cartPage.shipping).toHaveText('4,99 €');
    await expect(cartPage.total).toHaveText('49,88 €');
    await expect(cartPage.freeShippingLeft).toHaveText('5,11 €');
  });

  test('increasing a quantity updates the line and unlocks free shipping', async ({ cartPage }) => {
    await cartPage.increaseQuantity(mug.name);

    await expect(cartPage.quantityInput(mug.name)).toHaveValue('2');
    await expect(cartPage.itemTotal(mug.name)).toHaveText('19,98 €');
    await expect(cartPage.shipping).toHaveText('Nemokamai');
    await expect(cartPage.freeShipping).toHaveAttribute('data-state', 'free');
  });

  test('typing a quantity is saved to the server', async ({ cartPage, loggedInUser }) => {
    await cartPage.setQuantity(mug.name, 4);

    await expect(cartPage.itemTotal(mug.name)).toHaveText('39,96 €');
    await expect
      .poll(
        async () =>
          (await parseOk<Cart>(await loggedInUser.api.cart.get())).items.find((i) => i.productId === mug.id)?.quantity,
      )
      .toBe(4);
  });

  test('removing an item asks for confirmation', async ({ cartPage }) => {
    await cartPage.clickRemove(mug.name);
    await expect(cartPage.confirmDialog.message).toContainText(mug.name);

    await cartPage.confirmDialog.cancel();
    await expect(cartPage.items).toHaveCount(2);

    await cartPage.removeItem(mug.name);
    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.item(mug.name)).toHaveCount(0);
  });

  test('"clear cart" uses the native confirm dialog', async ({ cartPage }) => {
    await cartPage.clearCart({ accept: false });
    await expect(cartPage.items).toHaveCount(2);

    await cartPage.clearCart({ accept: true });
    await expect(cartPage.emptyState).toBeVisible();
    await expect(cartPage.header.cartBadge).toBeHidden();
  });

  test('applies and removes a promo code', async ({ cartPage }) => {
    await cartPage.applyPromo(PROMO_CODES.percent10.toLowerCase());

    await expect(cartPage.appliedPromoCode).toHaveText(PROMO_CODES.percent10);
    await expect(cartPage.discount).toHaveText('-4,49 €');
    await expect(cartPage.total).toHaveText('45,39 €');

    await cartPage.removePromoButton.click();
    await expect(cartPage.appliedPromoCode).toBeHidden();
    await expect(cartPage.total).toHaveText('49,88 €');
  });

  const rejectedCodes: { code: string; message: string }[] = [
    { code: PROMO_CODES.expired, message: 'Šio nuolaidos kodo galiojimas pasibaigęs.' },
    { code: 'NERA', message: 'Toks nuolaidos kodas neegzistuoja.' },
    { code: PROMO_CODES.percent20Min100, message: 'Kodas galioja užsakymams nuo 100,00 €.' },
  ];

  for (const { code, message } of rejectedCodes) {
    test(`rejects promo code ${code}`, async ({ cartPage }) => {
      await cartPage.applyPromo(code);

      await expect(cartPage.promoError).toHaveText(message);
      await expect(cartPage.appliedPromoCode).toBeHidden();
    });
  }
});

test.describe('Cart — guest', { tag: '@e2e' }, () => {
  test('an empty cart shows a call to action', async ({ cartPage }) => {
    await cartPage.goto();

    await expect(cartPage.emptyState).toBeVisible();
    await expect(cartPage.page.getByRole('link', { name: 'Pradėti apsipirkimą' })).toHaveAttribute(
      'href',
      'index.html',
    );
  });

  test('the guest cart is merged into the account on login', async ({ catalogPage, loginPage, cartPage, testUser }) => {
    await catalogPage.goto();
    await catalogPage.search(mug.name);
    await catalogPage.productCard(mug.name).addToCart();
    await expect(catalogPage.header.cartBadge).toHaveText('1');

    await loginPage.goto();
    await loginPage.login(testUser.data.email, testUser.data.password);
    await expect(loginPage.header.userGreeting).toBeVisible();

    await cartPage.goto();
    await expect(cartPage.item(mug.name)).toBeVisible();
    const cart = await parseOk<Cart>(await testUser.api.cart.get());
    expect(cart.items).toEqual([expect.objectContaining({ productId: mug.id, quantity: 1 })]);
  });
});
