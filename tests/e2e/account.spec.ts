import { expect, test } from '../../src/fixtures';
import type { LoginResponse, User } from '../../src/api/types';
import { parseOk } from '../../src/utils/api-assertions';

test.describe('Account — profile', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ loggedInUser, accountPage }) => {
    expect(loggedInUser.token).toBeTruthy();
    await accountPage.open('profile');
  });

  test('shows the user profile', async ({ accountPage, loggedInUser }) => {
    await expect(accountPage.greeting).toHaveText(`Sveiki, ${loggedInUser.data.firstName}!`);
    await expect(accountPage.emailInput).toHaveValue(loggedInUser.data.email);
    await expect(accountPage.emailInput).not.toBeEditable();
    await expect(accountPage.saveProfileButton).toBeDisabled();
  });

  test('editing enables "save"; reverting disables it again', async ({ accountPage, loggedInUser }) => {
    await accountPage.firstNameInput.fill('Petras');
    await expect(accountPage.saveProfileButton).toBeEnabled();
    await expect(accountPage.unsavedChangesNote).toBeVisible();

    await accountPage.firstNameInput.fill(loggedInUser.data.firstName);
    await expect(accountPage.saveProfileButton).toBeDisabled();
  });

  test('profile changes are saved and persist', { tag: '@smoke' }, async ({ accountPage, loggedInUser, page }) => {
    await accountPage.updateProfile({ firstName: 'Petras', phone: '+37061111111' });

    await expect(accountPage.toast.withText('Profilis atnaujintas.')).toBeVisible();
    await expect(accountPage.greeting).toHaveText('Sveiki, Petras!');
    await expect(accountPage.header.userGreeting).toHaveText('Petras');

    await page.reload();
    await expect(accountPage.firstNameInput).toHaveValue('Petras');
    const { user } = await parseOk<{ user: User }>(await loggedInUser.api.users.me());
    expect(user).toMatchObject({ firstName: 'Petras', phone: '+37061111111' });
  });

  test('invalid profile values are rejected', async ({ accountPage }) => {
    await accountPage.updateProfile({ lastName: 'X', phone: '123' });

    await expect(accountPage.page.getByTestId('profile-last-name-error')).toHaveText(
      'Pavardė turi būti bent 2 simbolių.',
    );
    await expect(accountPage.page.getByTestId('profile-phone-error')).toHaveText('Telefono formatas: +370XXXXXXXX.');
  });
});

test.describe('Account — password', { tag: '@e2e' }, () => {
  const NEW_PASSWORD = 'Naujas456@';

  test.beforeEach(async ({ loggedInUser, accountPage }) => {
    expect(loggedInUser.token).toBeTruthy();
    await accountPage.open('password');
  });

  test('changes the password', async ({ accountPage, loggedInUser, api }) => {
    await accountPage.changePassword(loggedInUser.data.password, NEW_PASSWORD);

    await expect(accountPage.toast.withText('Slaptažodis sėkmingai pakeistas.')).toBeVisible();
    await expect(accountPage.currentPasswordInput).toBeEmpty();
    await parseOk<LoginResponse>(await api.auth.login(loggedInUser.data.email, NEW_PASSWORD));
  });

  test('a wrong current password shows the server error', async ({ accountPage }) => {
    await accountPage.changePassword('Wrong123!', NEW_PASSWORD);

    await expect(accountPage.passwordErrorAlert).toHaveText('Dabartinis slaptažodis neteisingas.');
  });

  test('the confirmation must match', async ({ accountPage, loggedInUser }) => {
    await accountPage.changePassword(loggedInUser.data.password, NEW_PASSWORD, 'Kitas456@');

    await expect(accountPage.page.getByTestId('pw-confirm-error')).toHaveText('Slaptažodžiai nesutampa.');
  });
});

test.describe('Account — orders', { tag: '@e2e' }, () => {
  test('a new user has no orders', async ({ loggedInUser, accountPage }) => {
    expect(loggedInUser.token).toBeTruthy();

    await accountPage.open('orders');

    await expect(accountPage.ordersEmpty).toBeVisible();
    await expect(accountPage.ordersCount).toHaveText('0');
  });
});
