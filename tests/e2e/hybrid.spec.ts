import { expect, test } from '../../src/fixtures';
import type { Order } from '../../src/api/types';
import { PRODUCTS } from '../../src/data/constants';
import { buildOrderRequest } from '../../src/data/factories';
import { parseOk } from '../../src/utils/api-assertions';

/** Arrange through the API, act and assert in the UI (and the other way round). */
test.describe('API + UI', { tag: '@e2e' }, () => {
  test('an order created through the API is shown in the account and on its page', async ({
    loggedInUser,
    accountPage,
    orderPage,
  }) => {
    const order = await test.step('arrange: cart + order via API', async () => {
      await parseOk(await loggedInUser.api.cart.addItem({ productId: PRODUCTS.lamp.id, quantity: 2 }), 201);
      return (await parseOk<{ order: Order }>(await loggedInUser.api.orders.create(buildOrderRequest()), 201)).order;
    });

    await accountPage.open('orders');
    await expect(accountPage.ordersCount).toHaveText('1');
    await expect(accountPage.orderRow(order.id).getByTestId('order-row-total')).toHaveText('69,80 €');

    await accountPage.orderRow(order.id).getByRole('link', { name: order.id }).click();
    await orderPage.waitForLoaded();
    await expect(orderPage.orderNumber).toHaveText(order.id);
    await expect(orderPage.items).toHaveCount(1);
    await expect(orderPage.items.first()).toContainText(PRODUCTS.lamp.name);
    await expect(orderPage.successBanner).toBeHidden();
  });

  test('cancelling in the UI is reflected by the API', async ({ loggedInUser, orderPage }) => {
    await parseOk(await loggedInUser.api.cart.addItem({ productId: PRODUCTS.mug.id }), 201);
    const { order } = await parseOk<{ order: Order }>(await loggedInUser.api.orders.create(buildOrderRequest()), 201);

    await orderPage.open(order.id);
    await orderPage.cancelOrder();

    await expect(orderPage.status).toHaveText('Atšauktas');
    await expect(orderPage.cancelOrderButton).toBeHidden();
    const { order: reloaded } = await parseOk<{ order: Order }>(await loggedInUser.api.orders.get(order.id));
    expect(reloaded.status).toBe('cancelled');
  });

  test("another user's order is not visible", async ({ createUser, loggedInUser, orderPage }) => {
    const other = await createUser();
    await parseOk(await other.api.cart.addItem({ productId: PRODUCTS.mug.id }), 201);
    const { order } = await parseOk<{ order: Order }>(await other.api.orders.create(buildOrderRequest()), 201);
    expect(loggedInUser.user.id).not.toBe(other.user.id);

    await orderPage.open(order.id);

    await expect(orderPage.notFound).toBeVisible();
  });

  test('a revoked session sends the user back to login', async ({ loggedInUser, accountPage, loginPage, page }) => {
    await accountPage.open('profile');
    await expect(accountPage.greeting).toBeVisible();

    await loggedInUser.api.auth.logout();
    await page.reload();

    await expect(page).toHaveURL(/login\.html\?redirect=account\.html/);
    await expect(loginPage.toast.withText('Sesija baigėsi. Prisijunkite iš naujo.')).toBeVisible();
  });
});
