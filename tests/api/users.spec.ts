import { expect, test } from '../../src/fixtures';
import type { LoginResponse, User } from '../../src/api/types';
import { DEMO_PASSWORD, DEMO_USERS } from '../../src/data/constants';
import { expectApiError, parseOk } from '../../src/utils/api-assertions';
import { expectSchema } from '../../src/utils/schema';

test.describe('Users — profile', { tag: '@api' }, () => {
  test('GET /users/me returns the logged-in user', { tag: '@smoke' }, async ({ testUser }) => {
    const { user } = await parseOk<{ user: User }>(await testUser.api.users.me());

    expectSchema(user, 'User');
    expect(user).toMatchObject({ id: testUser.user.id, email: testUser.data.email, isDemo: false });
  });

  test('PATCH /users/me updates and persists profile fields', async ({ testUser }) => {
    const changes = { firstName: 'Petras', lastName: 'Petraitis', phone: '+37061111111', newsletter: true };

    const { user } = await parseOk<{ user: User }>(await testUser.api.users.update(changes));
    expect(user).toMatchObject(changes);

    const { user: reloaded } = await parseOk<{ user: User }>(await testUser.api.users.me());
    expect(reloaded).toMatchObject(changes);
  });

  test('PATCH with no known fields is rejected', async ({ testUser }) => {
    await expectApiError(await testUser.api.users.update({}), 422, 'VALIDATION_ERROR', { body: /bent vieną/ });
  });

  test('PATCH validates field values', async ({ testUser }) => {
    const res = await testUser.api.users.update({ firstName: 'X', phone: '12345' });

    await expectApiError(res, 422, 'VALIDATION_ERROR', { firstName: /bent 2/, phone: /\+370/ });
  });

  test('demo accounts are read-only', async ({ api }) => {
    const { token } = await parseOk<LoginResponse>(await api.auth.login(DEMO_USERS.standard, DEMO_PASSWORD));

    await expectApiError(await api.withToken(token).users.update({ firstName: 'Hacker' }), 403, 'DEMO_ACCOUNT');
  });
});

test.describe('Users — password', { tag: '@api' }, () => {
  const NEW_PASSWORD = 'Naujas456@';

  test('changes the password: old one stops working, new one works', async ({ api, testUser }) => {
    expect((await testUser.api.users.changePassword(testUser.data.password, NEW_PASSWORD)).status()).toBe(204);

    await expectApiError(await api.auth.login(testUser.data.email, testUser.data.password), 401, 'INVALID_CREDENTIALS');
    await parseOk<LoginResponse>(await api.auth.login(testUser.data.email, NEW_PASSWORD));
  });

  test('the current session survives a password change', async ({ testUser }) => {
    await testUser.api.users.changePassword(testUser.data.password, NEW_PASSWORD);

    await expect(await testUser.api.users.me()).toBeOK();
  });

  test('wrong current password is rejected', async ({ testUser }) => {
    const res = await testUser.api.users.changePassword('Wrong123!', NEW_PASSWORD);

    await expectApiError(res, 400, 'WRONG_PASSWORD', { currentPassword: /neteisingas/ });
  });

  test('new password must differ from the current one', async ({ testUser }) => {
    const res = await testUser.api.users.changePassword(testUser.data.password, testUser.data.password);

    await expectApiError(res, 422, 'VALIDATION_ERROR', { newPassword: /skirtis/ });
  });

  test('new password must satisfy the strength rules', async ({ testUser }) => {
    const res = await testUser.api.users.changePassword(testUser.data.password, 'weakpass');

    await expectApiError(res, 422, 'VALIDATION_ERROR', { newPassword: /.+/ });
  });
});

test.describe('Users — deletion', { tag: '@api' }, () => {
  test('DELETE /users/me removes the account and its sessions', async ({ api, testUser }) => {
    expect((await testUser.api.users.deleteMe()).status()).toBe(204);

    await expectApiError(await testUser.api.users.me(), 401, 'INVALID_TOKEN');
    await expectApiError(await api.auth.login(testUser.data.email, testUser.data.password), 401, 'INVALID_CREDENTIALS');
  });
});
