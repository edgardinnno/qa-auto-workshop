import { expect, test } from '../../src/fixtures';
import type { Review } from '../../src/api/types';
import { PRODUCTS } from '../../src/data/constants';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';
import { expectSchema } from '../../src/utils/schema';

// Reviews go to the shared server, so tests use a product that already has many reviews.
const PRODUCT_ID = PRODUCTS.mug.id;
const REVIEW_TEXT = 'Automatinio testo atsiliepimas: puikus puodelis.';

test.describe('Reviews', { tag: '@api' }, () => {
  test('lists reviews of a product', async ({ api }) => {
    const { items, total } = await parseOk<{ items: Review[]; total: number }>(await api.reviews.list(PRODUCT_ID));

    expect(total).toBe(items.length);
    for (const review of items) expectSchema(review, 'Review');
  });

  test('a user can post one review, shown with first name + initial', async ({ testUser }) => {
    const { review } = await parseOk<{ review: Review }>(
      await testUser.api.reviews.create(PRODUCT_ID, 5, REVIEW_TEXT),
      201,
    );

    expectSchema(review, 'Review');
    expect(review).toMatchObject({
      rating: 5,
      text: REVIEW_TEXT,
      author: `${testUser.user.firstName} ${testUser.user.lastName[0]}.`,
    });

    // Other workers post reviews to the same product concurrently, so don't assume it is first.
    const { items } = await parseOk<{ items: Review[] }>(await testUser.api.reviews.list(PRODUCT_ID));
    expect(items.map((r) => r.id)).toContain(review.id);
  });

  test('a second review of the same product → 409', async ({ testUser }) => {
    await parseOk(await testUser.api.reviews.create(PRODUCT_ID, 4, REVIEW_TEXT), 201);

    await expectApiError(await testUser.api.reviews.create(PRODUCT_ID, 3, REVIEW_TEXT), 409, 'REVIEW_EXISTS');
  });

  const invalidReviews: { name: string; rating: number; text: string; field: string }[] = [
    { name: 'rating above 5', rating: 6, text: REVIEW_TEXT, field: 'rating' },
    { name: 'rating below 1', rating: 0, text: REVIEW_TEXT, field: 'rating' },
    { name: 'text shorter than 10 chars', rating: 5, text: 'Gerai', field: 'text' },
  ];

  for (const { name, rating, text, field } of invalidReviews) {
    test(`rejects review: ${name}`, async ({ testUser }) => {
      await expectApiError(await testUser.api.reviews.create(PRODUCT_ID, rating, text), 422, 'VALIDATION_ERROR', {
        [field]: /.+/,
      });
    });
  }

  test('reviewing an unknown product → 404', async ({ testUser }) => {
    await expectApiError(await testUser.api.reviews.create('p999', 5, REVIEW_TEXT), 404, 'PRODUCT_NOT_FOUND');
  });
});
