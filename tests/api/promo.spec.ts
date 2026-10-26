import { expect, test } from '../../src/fixtures';
import type { Promo } from '../../src/api/types';
import { PROMO_CODES } from '../../src/data/constants';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';
import { expectSchema } from '../../src/utils/schema';

test.describe('Promo codes — guest validation', { tag: '@api' }, () => {
  const validCases: { id: string; code: string; subtotal: number; expected: Partial<Promo> }[] = [
    {
      id: 'TC-098',
      code: PROMO_CODES.percent10,
      subtotal: 10,
      expected: { code: 'PLAYWRIGHT10', type: 'percent', value: 10 },
    },
    {
      id: 'TC-099',
      code: PROMO_CODES.percent20Min100,
      subtotal: 100,
      expected: { code: 'DIDELIS20', type: 'percent', value: 20, min: 100 },
    },
    { id: 'TC-100', code: PROMO_CODES.freeShipping, subtotal: 0, expected: { code: 'NEMOKAMAS', type: 'shipping' } },
    { id: 'TC-101', code: 'playwright10', subtotal: 10, expected: { code: 'PLAYWRIGHT10' } },
    { id: 'TC-102', code: '  nemokamas  ', subtotal: 10, expected: { code: 'NEMOKAMAS' } },
  ];

  for (const { id, code, subtotal, expected } of validCases) {
    test(`${id}: accepts "${code}" for subtotal ${subtotal}`, async ({ api }) => {
      const { promo } = await parseOk<{ promo: Promo }>(await api.misc.validatePromo(code, subtotal));

      expectSchema(promo, 'Promo');
      expect(promo).toMatchObject(expected);
    });
  }

  const invalidCases: {
    id: string;
    name: string;
    code: string;
    subtotal?: number;
    status: number;
    errorCode: string;
  }[] = [
    { id: 'TC-103', name: 'unknown code', code: 'NERA', subtotal: 10, status: 404, errorCode: 'PROMO_NOT_FOUND' },
    {
      id: 'TC-104',
      name: 'expired code',
      code: PROMO_CODES.expired,
      subtotal: 10,
      status: 410,
      errorCode: 'PROMO_EXPIRED',
    },
    {
      id: 'TC-105',
      name: 'below minimum amount',
      code: PROMO_CODES.percent20Min100,
      subtotal: 99.99,
      status: 422,
      errorCode: 'PROMO_MIN_AMOUNT',
    },
    { id: 'TC-106', name: 'empty code', code: '', subtotal: 10, status: 422, errorCode: 'VALIDATION_ERROR' },
    {
      id: 'TC-107',
      name: 'negative subtotal',
      code: PROMO_CODES.percent10,
      subtotal: -1,
      status: 422,
      errorCode: 'VALIDATION_ERROR',
    },
  ];

  for (const { id, name, code, subtotal, status, errorCode } of invalidCases) {
    test(`${id}: rejects: ${name}`, async ({ api }) => {
      await expectApiError(await api.misc.validatePromo(code, subtotal), status, errorCode);
    });
  }
});
