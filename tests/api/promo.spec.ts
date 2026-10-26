import { expect, test } from '../../src/fixtures';
import type { Promo } from '../../src/api/types';
import { PROMO_CODES } from '../../src/data/constants';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';
import { expectSchema } from '../../src/utils/schema';

test.describe('Promo codes — guest validation', { tag: '@api' }, () => {
  const validCases: { code: string; subtotal: number; expected: Partial<Promo> }[] = [
    { code: PROMO_CODES.percent10, subtotal: 10, expected: { code: 'PLAYWRIGHT10', type: 'percent', value: 10 } },
    {
      code: PROMO_CODES.percent20Min100,
      subtotal: 100,
      expected: { code: 'DIDELIS20', type: 'percent', value: 20, min: 100 },
    },
    { code: PROMO_CODES.freeShipping, subtotal: 0, expected: { code: 'NEMOKAMAS', type: 'shipping' } },
    { code: 'playwright10', subtotal: 10, expected: { code: 'PLAYWRIGHT10' } },
    { code: '  nemokamas  ', subtotal: 10, expected: { code: 'NEMOKAMAS' } },
  ];

  for (const { code, subtotal, expected } of validCases) {
    test(`accepts "${code}" for subtotal ${subtotal}`, async ({ api }) => {
      const { promo } = await parseOk<{ promo: Promo }>(await api.misc.validatePromo(code, subtotal));

      expectSchema(promo, 'Promo');
      expect(promo).toMatchObject(expected);
    });
  }

  const invalidCases: { name: string; code: string; subtotal?: number; status: number; errorCode: string }[] = [
    { name: 'unknown code', code: 'NERA', subtotal: 10, status: 404, errorCode: 'PROMO_NOT_FOUND' },
    { name: 'expired code', code: PROMO_CODES.expired, subtotal: 10, status: 410, errorCode: 'PROMO_EXPIRED' },
    {
      name: 'below minimum amount',
      code: PROMO_CODES.percent20Min100,
      subtotal: 99.99,
      status: 422,
      errorCode: 'PROMO_MIN_AMOUNT',
    },
    { name: 'empty code', code: '', subtotal: 10, status: 422, errorCode: 'VALIDATION_ERROR' },
    {
      name: 'negative subtotal',
      code: PROMO_CODES.percent10,
      subtotal: -1,
      status: 422,
      errorCode: 'VALIDATION_ERROR',
    },
  ];

  for (const { name, code, subtotal, status, errorCode } of invalidCases) {
    test(`rejects: ${name}`, async ({ api }) => {
      await expectApiError(await api.misc.validatePromo(code, subtotal), status, errorCode);
    });
  }
});
