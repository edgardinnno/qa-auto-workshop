import { expect, test } from '../../src/fixtures';
import type { ProductList } from '../../src/api/types';
import { CATEGORIES, PRODUCTS } from '../../src/data/constants';
import { parseOk } from '../../src/utils/api-assertions';

test.describe('Catalog', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ catalogPage }) => {
    await catalogPage.goto();
  });

  test(
    'shows the first page of products with a total that matches the API',
    { tag: '@smoke' },
    async ({ catalogPage, api }) => {
      const { total } = await parseOk<ProductList>(await api.products.list());

      // Lithuanian plural form depends on the number (1 prekė, 2 prekės, 10 prekių), so match the number only.
      await expect(catalogPage.resultsCount).toHaveText(new RegExp(`^Rasta ${total} prek`));
      await expect(catalogPage.productCards).toHaveCount(8);
    },
  );

  test('searches by name, ignoring diacritics', async ({ catalogPage, page }) => {
    await catalogPage.search('sviesa');

    await expect(catalogPage.productNames).toHaveText([PRODUCTS.lamp.name]);
    await expect(page).toHaveURL(/\?q=sviesa$/);
  });

  test('a search with no results shows the empty state, which can be reset', async ({ catalogPage }) => {
    await catalogPage.search('nėra-tokios-prekės');
    await expect(catalogPage.emptyState).toBeVisible();
    await expect(catalogPage.productCards).toHaveCount(0);

    await catalogPage.clearFilters();

    await expect(catalogPage.emptyState).toBeHidden();
    await expect(catalogPage.searchInput).toBeEmpty();
    await expect(catalogPage.productCards).toHaveCount(8);
  });

  test('filters by category', async ({ catalogPage, api }) => {
    const { items } = await parseOk<ProductList>(await api.products.list({ category: 'knygos', limit: 50 }));

    await catalogPage.filterByCategory('knygos');

    await expect(catalogPage.productNames).toHaveText(items.map((p) => p.name));
    await expect(catalogPage.page).toHaveURL(/cat=knygos/);
  });

  test('a category tile applies the same filter', async ({ catalogPage, page }) => {
    await catalogPage.page.getByTestId('category-tile-namai').click();

    await expect(catalogPage.categorySelect).toHaveValue('namai');
    await expect(page).toHaveURL(/cat=namai/);
    await expect(catalogPage.productCards.first()).toContainText(CATEGORIES.namai);
  });

  test('sorts by price ascending and descending', async ({ catalogPage }) => {
    await catalogPage.sortBy('price-asc');
    const ascending = await catalogPage.priceValues();
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b));

    await catalogPage.sortBy('price-desc');
    const descending = await catalogPage.priceValues();
    expect(descending).toEqual([...descending].sort((a, b) => b - a));
  });

  test('"only in stock" hides sold-out products', async ({ catalogPage }) => {
    await catalogPage.filterByCategory('elektronika');
    await expect(catalogPage.productCard(PRODUCTS.speaker.name).stockBadge).toHaveText('Išparduota');

    await catalogPage.showOnlyInStock();

    await expect(catalogPage.productCard(PRODUCTS.speaker.name).root).toHaveCount(0);
    await expect(catalogPage.page).toHaveURL(/stock=1/);
  });

  test('paginates through the results', async ({ catalogPage }) => {
    const firstPage = await catalogPage.productNames.allTextContents();
    await expect(catalogPage.previousPageButton).toBeDisabled();

    await catalogPage.goToPage(2);

    await expect(catalogPage.pageButton(2)).toHaveAttribute('aria-current', 'page');
    await expect(catalogPage.productNames.first()).not.toHaveText(firstPage[0]);
    await expect(catalogPage.page).toHaveURL(/page=2/);
  });

  test('filters are restored from the URL', async ({ catalogPage }) => {
    await catalogPage.goto('?cat=sportas&sort=price-asc&stock=1');

    await expect(catalogPage.categorySelect).toHaveValue('sportas');
    await expect(catalogPage.sortSelect).toHaveValue('price-asc');
    await expect(catalogPage.inStockCheckbox).toBeChecked();
  });

  test('a sold-out product has a disabled button, a sized one links to options', async ({ catalogPage }) => {
    await catalogPage.search(PRODUCTS.speaker.name);
    await expect(catalogPage.productCard(PRODUCTS.speaker.name).addToCartButton).toBeDisabled();

    await catalogPage.search(PRODUCTS.tShirt.name);
    await expect(catalogPage.productCard(PRODUCTS.tShirt.name).chooseOptionsLink).toHaveAttribute(
      'href',
      `product.html?id=${PRODUCTS.tShirt.id}`,
    );
  });
});

test.describe('Catalog — network mocking', { tag: '@e2e' }, () => {
  test('server error shows a message, and "retry" recovers', async ({ catalogPage, page }) => {
    let failNext = true;
    await page.route('**/api/products?*', async (route) => {
      if (failNext) {
        failNext = false;
        await route.fulfill({
          status: 500,
          json: { error: { code: 'SERVER_ERROR', message: 'Serveris nepasiekiamas.' } },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('index.html');

    await expect(catalogPage.loadError).toContainText('Serveris nepasiekiamas.');
    await expect(catalogPage.productCards).toHaveCount(0);

    await catalogPage.retryButton.click();

    await expect(catalogPage.loadError).toBeHidden();
    await expect(catalogPage.productCards).toHaveCount(8);
  });

  test('network failure shows the offline message', async ({ catalogPage, page }) => {
    await page.route('**/api/products?*', (route) => route.abort('internetdisconnected'));

    await page.goto('index.html');

    await expect(catalogPage.loadError).toContainText('Nepavyko susisiekti su serveriu');
  });

  test('renders exactly what the API returns', async ({ catalogPage, page }) => {
    await page.route('**/api/products?*', (route) =>
      route.fulfill({
        json: {
          items: [
            {
              id: 'mock-1',
              name: 'Testinė prekė',
              category: 'knygos',
              categoryName: 'Knygos',
              price: 1.5,
              oldPrice: 3,
              rating: 4,
              reviewsCount: 1,
              stock: 2,
              image: '🧪',
              hue: 100,
              description: '',
              specs: {},
              variants: {},
            },
          ],
          total: 1,
          page: 1,
          limit: 8,
          pages: 1,
        },
      }),
    );

    await page.goto('index.html');

    const card = catalogPage.productCard('Testinė prekė');
    await expect(catalogPage.resultsCount).toHaveText('Rasta 1 prekė');
    await expect(card.price).toHaveText('1,50 €');
    await expect(card.oldPrice).toHaveText('3,00 €');
    await expect(card.root.getByTestId('discount-badge')).toHaveText('-50%');
    await expect(card.stockBadge).toHaveText('Liko 2 vnt.');
    await expect(catalogPage.pagination).toBeEmpty();
  });
});
