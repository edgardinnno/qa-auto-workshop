import { expect, test } from '../../src/fixtures';
import type { Product } from '../../src/api/types';
import { PRODUCTS } from '../../src/data/constants';
import { parseOk } from '../../src/utils/api-assertions';

test.describe('Product page', { tag: '@e2e' }, () => {
  test('shows the product as returned by the API', async ({ productPage, api, page }) => {
    const { product } = await parseOk<{ product: Product }>(await api.products.get(PRODUCTS.mug.id));

    await productPage.open(product.id);

    await expect(productPage.title).toHaveText(product.name);
    await expect(productPage.price).toHaveText('9,99 €');
    await expect(productPage.stockStatus).toHaveText(`Sandėlyje: ${product.stock} vnt.`);
    await expect(page).toHaveTitle(`${product.name} | QA Turgus`);
  });

  test('tabs switch between description and specifications', async ({ productPage }) => {
    await productPage.open(PRODUCTS.mug.id);

    await productPage.tab('Specifikacijos').click();

    await expect(productPage.tab('Specifikacijos')).toHaveAttribute('aria-selected', 'true');
    await expect(productPage.page.getByTestId('specs-table')).toContainText('Talpa');
    await expect(productPage.page.getByTestId('panel-description')).toBeHidden();
  });

  test('a guest adds a product and the header badge updates', { tag: '@smoke' }, async ({ productPage }) => {
    await productPage.open(PRODUCTS.mug.id);

    await productPage.setQuantity(3);
    await productPage.addToCart();

    await expect(productPage.toast.withText(`„${PRODUCTS.mug.name}“ (3 vnt.) pridėta į krepšelį.`)).toBeVisible();
    await expect(productPage.header.cartBadge).toHaveText('3');
    await expect(productPage.quantityInput).toHaveValue('1');
  });

  test('a logged-in user adds to the server-side cart', async ({ productPage, loggedInUser, page }) => {
    await productPage.open(PRODUCTS.headphones.id);
    await productPage.chooseColor(PRODUCTS.headphones.colors[1]);
    await expect(productPage.selectedColor).toHaveText(PRODUCTS.headphones.colors[1]);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().endsWith('/api/cart/items') && res.request().method() === 'POST'),
      productPage.addToCart(),
    ]);

    expect(response.status()).toBe(201);
    expect(response.request().postDataJSON()).toEqual({
      productId: PRODUCTS.headphones.id,
      quantity: 1,
      color: PRODUCTS.headphones.colors[1],
    });
    await expect(productPage.header.cartBadge).toHaveText('1');
    const cart = await parseOk<{ items: { color: string }[] }>(await loggedInUser.api.cart.get());
    expect(cart.items[0].color).toBe(PRODUCTS.headphones.colors[1]);
  });

  test('a size must be chosen for clothing', async ({ productPage }) => {
    await productPage.open(PRODUCTS.tShirt.id);

    await productPage.addToCart();
    await expect(productPage.sizeError).toHaveText('Pasirinkite dydį.');
    await expect(productPage.header.cartBadge).toBeHidden();

    await productPage.chooseSize('M');
    await productPage.addToCart();
    await expect(productPage.sizeError).toBeHidden();
    await expect(productPage.header.cartBadge).toHaveText('1');
  });

  test('quantity cannot exceed the stock', async ({ productPage }) => {
    await productPage.open(PRODUCTS.keyboard.id);
    await expect(productPage.stockStatus).toHaveText(`Liko tik ${PRODUCTS.keyboard.stock} vnt.!`);

    await productPage.setQuantity(PRODUCTS.keyboard.stock + 1);
    await productPage.addToCart();

    await expect(productPage.quantityError).toHaveText(`Maksimalus galimas kiekis – ${PRODUCTS.keyboard.stock} vnt.`);
  });

  test('a sold-out product cannot be added', async ({ productPage }) => {
    await productPage.open(PRODUCTS.speaker.id);

    await expect(productPage.stockStatus).toHaveText('Išparduota');
    await expect(productPage.addToCartButton).toBeDisabled();
    await expect(productPage.quantityInput).toBeDisabled();
  });

  test('an unknown product id shows "not found"', async ({ productPage }) => {
    await productPage.open('p999');

    await expect(productPage.notFound).toBeVisible();
    await expect(productPage.detail).toBeHidden();
  });
});
