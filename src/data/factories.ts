import { randomUUID } from 'node:crypto';
import type { Address, ContactMessageRequest, OrderRequest, RegisterRequest } from '../api/types';
import { TEST_CARDS } from './constants';

/** Valid password that satisfies every rule (length, upper, lower, digit, special). */
export const DEFAULT_PASSWORD = 'Testas123!';

const uniqueSuffix = () => `${Date.now()}-${randomUUID().slice(0, 8)}`;

/** Unique, valid email. Every call returns a new address, so parallel workers never collide. */
export const uniqueEmail = (prefix = 'qa-auto') => `${prefix}-${uniqueSuffix()}@test.lt`;

/** A date string exactly `years` years ago (YYYY-MM-DD). */
export function birthDateYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

export function buildUser(overrides: Partial<RegisterRequest> = {}): RegisterRequest {
  return {
    firstName: 'Testas',
    lastName: 'Automatas',
    email: uniqueEmail(),
    phone: '+37060000000',
    birthDate: '1995-06-01',
    country: 'LT',
    password: DEFAULT_PASSWORD,
    newsletter: false,
    ...overrides,
  };
}

export function buildAddress(overrides: Partial<Address> = {}): Address {
  return {
    firstName: 'Jonas',
    lastName: 'Jonaitis',
    phone: '+37060000000',
    street: 'Testuotojų g. 1',
    city: 'Vilnius',
    postal: 'LT-01234',
    ...overrides,
  };
}

/** Card expiry two years in the future (MM/YY). */
export function futureExpiry(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String((d.getFullYear() + 2) % 100).padStart(2, '0')}`;
}

/** Courier delivery + card payment with the always-successful test card. */
export function buildOrderRequest(overrides: Partial<OrderRequest> = {}): OrderRequest {
  return {
    address: buildAddress(),
    delivery: { method: 'courier' },
    payment: {
      method: 'card',
      card: { holder: 'Jonas Jonaitis', number: TEST_CARDS.success, expiry: futureExpiry(), cvc: '123' },
    },
    ...overrides,
  };
}

export function buildContactMessage(overrides: Partial<ContactMessageRequest> = {}): ContactMessageRequest {
  return {
    name: 'Jonas Jonaitis',
    email: uniqueEmail('contact'),
    topic: 'other',
    message: 'Sveiki, tai automatinio testo žinutė apie užsakymą.',
    ...overrides,
  };
}
