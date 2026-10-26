import { expect, test } from '../../src/fixtures';
import type { LoginResponse, User } from '../../src/api/types';
import { DEMO_PASSWORD, DEMO_USERS } from '../../src/data/constants';
import { birthDateYearsAgo, buildUser } from '../../src/data/factories';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';
import { expectSchema } from '../../src/utils/schema';

test.describe('Auth — registration', { tag: '@api' }, () => {
  test('TC-004: registers a new user', { tag: '@smoke' }, async ({ api }) => {
    const data = buildUser();

    const res = await api.auth.register(data);
    const { user } = await parseOk<{ user: User }>(res, 201);

    expectSchema(user, 'User');
    expect(user).toMatchObject({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      country: data.country,
      isDemo: false,
    });
    expect(user).not.toHaveProperty('password');
    expect(res.headers()['location']).toBe('/api/users/me');

    // Cleanup: this test registers outside the testUser fixture, so it deletes its own account.
    const { token } = await parseOk<LoginResponse>(await api.auth.login(data.email, data.password));
    expect((await api.withToken(token).users.deleteMe()).status()).toBe(204);
  });

  test('TC-005: rejects an email that is already registered', async ({ api, testUser }) => {
    const res = await api.auth.register(buildUser({ email: testUser.data.email }));

    await expectApiError(res, 409, 'EMAIL_TAKEN', { email: /užimtas/ });
  });

  test('TC-006: normalises email to lower case, so case variants are duplicates', async ({ api, testUser }) => {
    const res = await api.auth.register(buildUser({ email: testUser.data.email.toUpperCase() }));

    await expectApiError(res, 409, 'EMAIL_TAKEN');
  });

  const invalidCases: {
    id: string;
    name: string;
    overrides: Record<string, unknown>;
    field: string;
    message: RegExp;
  }[] = [
    {
      id: 'TC-007',
      name: 'missing first name',
      overrides: { firstName: '' },
      field: 'firstName',
      message: /Įveskite vardą/,
    },
    {
      id: 'TC-008',
      name: 'one-letter first name',
      overrides: { firstName: 'A' },
      field: 'firstName',
      message: /bent 2/,
    },
    {
      id: 'TC-009',
      name: 'digits in last name',
      overrides: { lastName: 'Jonaitis2' },
      field: 'lastName',
      message: /tik raidės/,
    },
    {
      id: 'TC-010',
      name: 'malformed email',
      overrides: { email: 'not-an-email' },
      field: 'email',
      message: /formatas/,
    },
    {
      id: 'TC-011',
      name: 'phone in wrong format',
      overrides: { phone: '860000000' },
      field: 'phone',
      message: /\+370/,
    },
    {
      id: 'TC-012',
      name: 'under 18',
      overrides: { birthDate: birthDateYearsAgo(17) },
      field: 'birthDate',
      message: /nuo 18/,
    },
    {
      id: 'TC-013',
      name: 'date in wrong format',
      overrides: { birthDate: '01/06/1995' },
      field: 'birthDate',
      message: /YYYY-MM-DD/,
    },
    { id: 'TC-014', name: 'unsupported country', overrides: { country: 'US' }, field: 'country', message: /LT/ },
    {
      id: 'TC-015',
      name: 'password without digit',
      overrides: { password: 'Testas!!' },
      field: 'password',
      message: /skaičius/,
    },
    {
      id: 'TC-016',
      name: 'password too short',
      overrides: { password: 'Te1!' },
      field: 'password',
      message: /8 simbolių/,
    },
  ];

  for (const { id, name, overrides, field, message } of invalidCases) {
    test(`${id}: rejects registration: ${name}`, async ({ api }) => {
      const res = await api.auth.register({ ...buildUser(), ...overrides });

      await expectApiError(res, 422, 'VALIDATION_ERROR', { [field]: message });
    });
  }

  test('TC-017: rejects a body that is not valid JSON', async ({ apiContext }) => {
    const res = await apiContext.post('auth/register', {
      headers: { 'Content-Type': 'application/json' },
      data: '{ not json',
    });

    await expectApiError(res, 400, 'INVALID_JSON');
  });
});

test.describe('Auth — login & logout', { tag: '@api' }, () => {
  test('TC-018: logs in and returns a Bearer token', { tag: '@smoke' }, async ({ api, testUser }) => {
    const body = await parseOk<LoginResponse>(await api.auth.login(testUser.data.email, testUser.data.password));

    expectSchema(body, 'LoginResponse');
    expect(body.tokenType).toBe('Bearer');
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(testUser.data.email);
  });

  test('TC-019: "remember me" extends the session to 7 days', async ({ api, testUser }) => {
    const short = await parseOk<LoginResponse>(await api.auth.login(testUser.data.email, testUser.data.password));
    const long = await parseOk<LoginResponse>(await api.auth.login(testUser.data.email, testUser.data.password, true));

    const hours = (iso: string) => (Date.parse(iso) - Date.now()) / 3_600_000;
    expect(hours(short.expiresAt)).toBeGreaterThan(23);
    expect(hours(short.expiresAt)).toBeLessThanOrEqual(24);
    expect(hours(long.expiresAt)).toBeGreaterThan(24 * 7 - 1);
  });

  test('TC-020: rejects a wrong password', async ({ api, testUser }) => {
    const res = await api.auth.login(testUser.data.email, 'Wrong123!');

    await expectApiError(res, 401, 'INVALID_CREDENTIALS');
  });

  test('TC-021: rejects an unknown email with the same error (no user enumeration)', async ({ api }) => {
    const res = await api.auth.login('nobody-here@test.lt', 'Wrong123!');

    await expectApiError(res, 401, 'INVALID_CREDENTIALS');
  });

  test('TC-022: locked account cannot log in', async ({ api }) => {
    const res = await api.auth.login(DEMO_USERS.locked, DEMO_PASSWORD);

    await expectApiError(res, 403, 'ACCOUNT_LOCKED');
  });

  test('TC-023: missing credentials fail validation', async ({ api }) => {
    const res = await api.auth.login('', '');

    await expectApiError(res, 422, 'VALIDATION_ERROR', { email: /el. pašto/, password: /slaptažodį/ });
  });

  test('TC-024: logout revokes the token', async ({ testUser }) => {
    expect((await testUser.api.auth.logout()).status()).toBe(204);

    await expectApiError(await testUser.api.users.me(), 401, 'INVALID_TOKEN');
  });

  test('TC-025: slow demo user still logs in (2.5–4 s latency)', async ({ api }) => {
    test.slow();
    const started = Date.now();

    await parseOk<LoginResponse>(await api.auth.login(DEMO_USERS.slow, DEMO_PASSWORD));

    expect(Date.now() - started).toBeGreaterThanOrEqual(2_500);
  });
});
