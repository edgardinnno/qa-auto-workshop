import { expect, test } from '../../src/fixtures';
import type { Product, ProductList } from '../../src/api/types';
import { CATEGORIES, PRODUCTS, type Category, type SortOption } from '../../src/data/constants';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';
import { expectSchema } from '../../src/utils/schema';

const byLithuanian = (a: string, b: string) => a.localeCompare(b, 'lt');

/** Expected ordering per sort option, expressed as a comparator that must hold for neighbours. */
const SORT_CHECKS: Record<SortOption, (a: Product, b: Product) => boolean> = {
  popular: (a, b) => a.reviewsCount >= b.reviewsCount,
  'price-asc': (a, b) => a.price <= b.price,
  'price-desc': (a, b) => a.price >= b.price,
  'name-asc': (a, b) => byLithuanian(a.name, b.name) <= 0,
  'name-desc': (a, b) => byLithuanian(a.name, b.name) >= 0,
  rating: (a, b) => a.rating >= b.rating,
};

test.describe('Products', { tag: '@api' }, () => {
  test('TC-071: lists products with pagination metadata', { tag: '@smoke' }, async ({ api }) => {
    const body = await parseOk<ProductList>(await api.products.list());

    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
    expect(body.total).toBeGreaterThan(0);
    expect(body.pages).toBe(Math.ceil(body.total / body.limit));
    expect(body.items).toHaveLength(Math.min(body.limit, body.total));
    for (const product of body.items) expectSchema(product, 'Product');
  });

  test('TC-072: paginates without overlap and covers every product', async ({ api }) => {
    const first = await parseOk<ProductList>(await api.products.list({ limit: 8, page: 1 }));
    const pages = [first];
    for (let page = 2; page <= first.pages; page++) {
      pages.push(await parseOk<ProductList>(await api.products.list({ limit: 8, page })));
    }

    const ids = pages.flatMap((p) => p.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(first.total);
  });

  test('TC-073: page beyond the last one returns an empty list', async ({ api }) => {
    const body = await parseOk<ProductList>(await api.products.list({ page: 999 }));

    expect(body.items).toEqual([]);
  });

  const sortCases: { id: string; sort: SortOption }[] = [
    { id: 'TC-074', sort: 'popular' },
    { id: 'TC-075', sort: 'price-asc' },
    { id: 'TC-076', sort: 'price-desc' },
    { id: 'TC-077', sort: 'name-asc' },
    { id: 'TC-078', sort: 'name-desc' },
    { id: 'TC-079', sort: 'rating' },
  ];

  for (const { id, sort } of sortCases) {
    test(`${id}: sorts by ${sort}`, async ({ api }) => {
      const { items } = await parseOk<ProductList>(await api.products.list({ sort, limit: 50 }));

      const inOrder = SORT_CHECKS[sort];
      const outOfOrder = items.slice(1).filter((item, i) => !inOrder(items[i], item));
      expect(outOfOrder, `items out of order for sort=${sort}`).toEqual([]);
    });
  }

  const categoryCases: { id: string; category: Category }[] = [
    { id: 'TC-080', category: 'elektronika' },
    { id: 'TC-081', category: 'drabuziai' },
    { id: 'TC-082', category: 'namai' },
    { id: 'TC-083', category: 'sportas' },
    { id: 'TC-084', category: 'knygos' },
  ];

  for (const { id, category } of categoryCases) {
    test(`${id}: filters by category "${category}"`, async ({ api }) => {
      const { items } = await parseOk<ProductList>(await api.products.list({ category, limit: 50 }));

      expect(items.length).toBeGreaterThan(0);
      expect(items.every((p) => p.category === category)).toBe(true);
    });
  }

  test('TC-085: inStock=true hides sold-out products', async ({ api }) => {
    const all = await parseOk<ProductList>(await api.products.list({ limit: 50 }));
    const inStock = await parseOk<ProductList>(await api.products.list({ inStock: true, limit: 50 }));

    expect(all.items.some((p) => p.stock === 0)).toBe(true);
    expect(inStock.items.every((p) => p.stock > 0)).toBe(true);
    expect(inStock.total).toBe(all.items.filter((p) => p.stock > 0).length);
  });

  test('TC-086: search ignores Lithuanian diacritics', async ({ api }) => {
    const { items } = await parseOk<ProductList>(await api.products.list({ q: 'sviesa' }));

    expect(items.map((p) => p.name)).toContain(PRODUCTS.lamp.name);
  });

  test('TC-087: search with no matches returns total 0', async ({ api }) => {
    const body = await parseOk<ProductList>(await api.products.list({ q: 'zzz-no-such-product' }));

    expect(body).toMatchObject({ items: [], total: 0 });
  });

  const invalidQueries: { id: string; name: string; query: Record<string, string | number>; field: string }[] = [
    { id: 'TC-088', name: 'limit=0', query: { limit: 0 }, field: 'limit' },
    { id: 'TC-089', name: 'limit=51', query: { limit: 51 }, field: 'limit' },
    { id: 'TC-090', name: 'page=0', query: { page: 0 }, field: 'page' },
    { id: 'TC-091', name: 'page=abc', query: { page: 'abc' }, field: 'page' },
    { id: 'TC-092', name: 'unknown sort', query: { sort: 'cheapest' }, field: 'sort' },
    { id: 'TC-093', name: 'unknown category', query: { category: 'auto' }, field: 'category' },
    { id: 'TC-094', name: 'search longer than 100 chars', query: { q: 'a'.repeat(101) }, field: 'q' },
  ];

  for (const { id, name, query, field } of invalidQueries) {
    test(`${id}: rejects invalid query: ${name}`, async ({ api }) => {
      await expectApiError(await api.products.list(query), 422, 'VALIDATION_ERROR', { [field]: /.+/ });
    });
  }

  test('TC-095: returns a single product by id', async ({ api }) => {
    const { product } = await parseOk<{ product: Product }>(await api.products.get(PRODUCTS.mug.id));

    expectSchema(product, 'Product');
    expect(product).toMatchObject({ id: PRODUCTS.mug.id, name: PRODUCTS.mug.name, price: PRODUCTS.mug.price });
  });

  test('TC-096: unknown product id returns 404', async ({ api }) => {
    await expectApiError(await api.products.get('p999'), 404, 'PRODUCT_NOT_FOUND');
  });

  test('TC-097: categories include product counts that match the catalogue', async ({ api }) => {
    const { items } = await parseOk<{ items: { id: string; productCount: number }[] }>(await api.products.categories());
    const { total } = await parseOk<ProductList>(await api.products.list());

    expect(items.map((c) => c.id).sort()).toEqual(Object.keys(CATEGORIES).sort());
    expect(items.reduce((sum, c) => sum + c.productCount, 0)).toBe(total);
  });
});
