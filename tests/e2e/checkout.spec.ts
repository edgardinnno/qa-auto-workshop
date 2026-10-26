import { expect, test } from '../../src/fixtures';
import type { Order } from '../../src/api/types';
import { PARCEL_LOCKERS, PRODUCTS, TEST_CARDS } from '../../src/data/constants';
import { buildAddress, futureExpiry } from '../../src/data/factories';
import { parseOk } from '../../src/utils/api-assertions';

const card = (number: string) => ({ holder: 'Jonas Jonaitis', number, expiry: futureExpiry(), cvc: '123' });

test.describe('Checkout', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ loggedInUser }) => {
    // Arrange through the API: the cart is filled server-side before the browser opens.
    await parseOk(await loggedInUser.api.cart.addItem({ productId: PRODUCTS.mug.id, quantity: 2 }), 201);
  });

  test(
    'TC-219: a user completes a card purchase and sees the order in their account',
    { tag: '@smoke' },
    async ({ cartPage, checkoutPage, orderPage, accountPage, loggedInUser, page }) => {
      await test.step('go from the cart to checkout', async () => {
        await cartPage.goto();
        await expect(cartPage.total).toHaveText('24,97 €');
        await cartPage.proceedToCheckout();
        await expect(checkoutPage.heading).toBeVisible();
      });

      await test.step('1. address', async () => {
        await expect(checkoutPage.firstNameInput).toHaveValue(loggedInUser.data.firstName);
        await checkoutPage.fillAddress(buildAddress());
        await checkoutPage.next();
      });

      await test.step('2. delivery', async () => {
        await expect(checkoutPage.step(2)).toHaveAttribute('aria-current', 'step');
        await checkoutPage.chooseDelivery('courier');
        await checkoutPage.next();
      });

      await test.step('3. payment', async () => {
        await checkoutPage.fillCard(card(TEST_CARDS.success));
        await expect(checkoutPage.cardNumberInput).toHaveValue('4242 4242 4242 4242');
        await expect(checkoutPage.cardBrand).toHaveText('VISA');
        await checkoutPage.next();
      });

      await test.step('4. review and place the order', async () => {
        await expect(checkoutPage.reviewSummary).toContainText('Mokėjimo kortelė •••• 4242');
        await checkoutPage.acceptTermsAndPlaceOrder();
      });

      const orderId = await test.step('confirmation page', async () => {
        await expect(page).toHaveURL(/order\.html\?id=ORD-\d{6}&new=1/);
        await expect(orderPage.successBanner).toContainText('Ačiū! Užsakymas pateiktas');
        await expect(orderPage.status).toHaveText('Apdorojamas');
        await expect(orderPage.total).toHaveText('24,97 €');
        await expect(orderPage.header.cartBadge).toBeHidden();
        return (await orderPage.orderNumber.textContent())!;
      });

      await test.step('order is listed in the account and stored server-side', async () => {
        await accountPage.open('orders');
        await expect(accountPage.orderStatus(orderId)).toHaveText('Apdorojamas');
        const { order } = await parseOk<{ order: Order }>(await loggedInUser.api.orders.get(orderId));
        expect(order.items[0]).toMatchObject({ productId: PRODUCTS.mug.id, quantity: 2 });
      });
    },
  );

  test('TC-220: a declined card shows the payment error and keeps the cart', async ({ checkoutPage, loggedInUser }) => {
    await checkoutPage.goto();
    await checkoutPage.fillAddress(buildAddress());
    await checkoutPage.next();
    await checkoutPage.next();
    await checkoutPage.fillCard(card(TEST_CARDS.declined));
    await checkoutPage.next();

    await checkoutPage.acceptTermsAndPlaceOrder();

    await expect(checkoutPage.errorAlert).toHaveText('Kortelė atmesta. Pabandykite kitą mokėjimo kortelę.');
    await expect(checkoutPage.placeOrderButton).toBeEnabled();
    const cart = await parseOk<{ items: unknown[] }>(await loggedInUser.api.cart.get());
    expect(cart.items).toHaveLength(1);
  });

  test('TC-221: an invalid card number is caught before submitting', async ({ checkoutPage }) => {
    await checkoutPage.goto();
    await checkoutPage.fillAddress(buildAddress());
    await checkoutPage.next();
    await checkoutPage.next();

    await checkoutPage.fillCard(card(TEST_CARDS.invalidLuhn));
    await checkoutPage.next();

    await expect(checkoutPage.page.getByTestId('card-number-error')).toHaveText('Neteisingas kortelės numeris.');
    await expect(checkoutPage.step(3)).toHaveAttribute('aria-current', 'step');
  });

  test('TC-222: address step validates required fields and formats', async ({ checkoutPage }) => {
    await checkoutPage.goto();
    await checkoutPage.fillAddress(buildAddress({ phone: '860000000', street: 'Kt', city: '', postal: '123' }));

    await checkoutPage.next();

    await expect(checkoutPage.page.getByTestId('ship-phone-error')).toHaveText('Telefono formatas: +370XXXXXXXX.');
    await expect(checkoutPage.page.getByTestId('ship-address-error')).toHaveText('Adresas per trumpas.');
    await expect(checkoutPage.page.getByTestId('ship-city-error')).toHaveText('Įveskite miestą.');
    await expect(checkoutPage.page.getByTestId('ship-postal-error')).toHaveText('Pašto kodo formatas: LT-12345.');
    await expect(checkoutPage.step(1)).toHaveAttribute('aria-current', 'step');
  });

  test('TC-223: parcel locker: cheaper shipping, cash payment disabled', async ({ checkoutPage }) => {
    await checkoutPage.goto();
    await checkoutPage.fillAddress(buildAddress());
    await checkoutPage.next();

    await expect(checkoutPage.deliveryPrice('parcel')).toHaveText('2,99 €');
    await checkoutPage.chooseDelivery('parcel', PARCEL_LOCKERS[0]);
    await expect(checkoutPage.shipping).toHaveText('2,99 €');
    await checkoutPage.next();

    await expect(checkoutPage.paymentOption('cash')).toBeDisabled();
    await expect(checkoutPage.cashUnavailableNote).toBeVisible();
  });

  test('TC-224: pickup in store is free', async ({ checkoutPage }) => {
    await checkoutPage.goto();
    await checkoutPage.fillAddress(buildAddress());
    await checkoutPage.next();

    await checkoutPage.chooseDelivery('pickup');

    await expect(checkoutPage.shipping).toHaveText('Nemokamai');
    await expect(checkoutPage.total).toHaveText('19,98 €');
  });
});

test.describe('Checkout — access', { tag: '@e2e' }, () => {
  test('TC-225: a guest is sent to login when proceeding to checkout', async ({ productPage, cartPage, page }) => {
    await productPage.open(PRODUCTS.mug.id);
    await productPage.addToCart();
    await cartPage.goto();

    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL(/login\.html\?redirect=checkout\.html/);
  });

  test('TC-226: an empty cart redirects from checkout back to the cart', async ({ loggedInUser, page }) => {
    expect(loggedInUser.user.id).toBeTruthy();

    await page.goto('checkout.html');

    await expect(page).toHaveURL(/cart\.html$/);
  });
});
