import { expect, test } from '../../src/fixtures';
import { PRODUCTS } from '../../src/data/constants';

// Every other spec pre-accepts cookies; here the banner is under test.
test.use({ cookieConsent: false });

test.describe('Cookie banner', { tag: '@e2e' }, () => {
  test('appears shortly after load and remembers the choice', async ({ catalogPage, cookieBanner, page }) => {
    await catalogPage.goto();
    await expect(cookieBanner.root).toBeVisible();

    await cookieBanner.accept();

    await expect(cookieBanner.root).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('qa_cookie_consent'))).toBe('all');
    await page.reload();
    await expect(catalogPage.productCards.first()).toBeVisible();
    await expect(cookieBanner.root).toBeHidden();
  });

  test('"necessary only" is stored as a separate choice', async ({ catalogPage, cookieBanner, page }) => {
    await catalogPage.goto();

    await cookieBanner.necessaryOnlyButton.click();

    expect(await page.evaluate(() => localStorage.getItem('qa_cookie_consent'))).toBe('necessary');
  });

  test('addLocatorHandler dismisses the banner whenever it gets in the way', async ({
    productPage,
    cookieBanner,
    page,
  }) => {
    await page.addLocatorHandler(cookieBanner.root, async () => {
      await cookieBanner.accept();
    });

    await productPage.open(PRODUCTS.mug.id);
    await productPage.addToCart();

    await expect(productPage.header.cartBadge).toHaveText('1');
  });
});
