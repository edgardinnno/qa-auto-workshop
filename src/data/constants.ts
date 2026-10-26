/** Static test data documented by QA Turgus (README + /openapi.json). */

export const DEMO_PASSWORD = 'Slaptas123!';

/** Shared, read-only demo accounts. Use them only for their special behaviour, never for state-changing tests. */
export const DEMO_USERS = {
  standard: 'standartinis@test.lt',
  /** Login → 403 ACCOUNT_LOCKED */
  locked: 'uzblokuotas@test.lt',
  /** Every API response is delayed 2.5–4 s */
  slow: 'letas@test.lt',
  /** POST /orders → 500 SERVER_ERROR */
  error: 'klaidingas@test.lt',
} as const;

export const PROMO_CODES = {
  /** -10 % on the whole cart */
  percent10: 'PLAYWRIGHT10',
  /** -20 %, only for subtotal ≥ 100 € (otherwise 422 PROMO_MIN_AMOUNT) */
  percent20Min100: 'DIDELIS20',
  /** Free shipping */
  freeShipping: 'NEMOKAMAS',
  /** 410 PROMO_EXPIRED */
  expired: 'SENAS2024',
} as const;

export const TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  /** Fails the Luhn check → 422 */
  invalidLuhn: '1234567890123456',
} as const;

export const FREE_SHIPPING_FROM = 50;

export const SHIPPING = {
  courier: { label: 'Kurjeris į namus', price: 4.99 },
  parcel: { label: 'Paštomatas', price: 2.99 },
  pickup: { label: 'Atsiėmimas parduotuvėje', price: 0 },
} as const;

export const PARCEL_LOCKERS = ['Vilnius – Centras (Gedimino pr. 9)', 'Kaunas – Senamiestis (Rotušės a. 3)'] as const;

export const CATEGORIES = {
  elektronika: 'Elektronika',
  drabuziai: 'Drabužiai',
  namai: 'Namai',
  sportas: 'Sportas',
  knygos: 'Knygos',
} as const;

export type Category = keyof typeof CATEGORIES;

export const SORT_OPTIONS = ['popular', 'price-asc', 'price-desc', 'name-asc', 'name-desc', 'rating'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/**
 * Seeded products with known, stable properties (stock never decreases on the shared server).
 * Prefer these over hard-coding ids in specs.
 */
export const PRODUCTS = {
  /** 9,99 €, stock 100, no variants — the default cheap item */
  mug: { id: 'p11', name: 'Kavos puodelis Rytas', price: 9.99 },
  /** 34,90 €, stock 7, no variants */
  lamp: { id: 'p12', name: 'Stalinė lempa Šviesa', price: 34.9 },
  /** 109 €, stock 3 — handy for OUT_OF_STOCK checks */
  keyboard: { id: 'p4', name: 'Mechaninė klaviatūra Klik', price: 109, stock: 3 },
  /** Sold out (stock 0) */
  speaker: { id: 'p3', name: 'Nešiojama kolonėlė Bosas', price: 59.9 },
  /** Colours: Juoda, Balta */
  headphones: { id: 'p1', name: 'Belaidės ausinės Garsas Pro', price: 89.99, colors: ['Juoda', 'Balta'] },
  /** Sizes XS–XL and colours Balta/Juoda/Mėlyna */
  tShirt: {
    id: 'p6',
    name: 'Medvilniniai marškinėliai Bazė',
    price: 14.99,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Balta', 'Juoda', 'Mėlyna'],
  },
} as const;
