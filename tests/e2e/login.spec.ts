import { expect, test } from '../../src/fixtures';
import { DEMO_PASSWORD, DEMO_USERS } from '../../src/data/constants';

test.describe('Login', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('a registered user can log in', { tag: '@smoke' }, async ({ loginPage, testUser, page }) => {
    await loginPage.login(testUser.data.email, testUser.data.password);

    await expect(page).toHaveURL(/index\.html$/);
    await expect(loginPage.header.userGreeting).toHaveText(testUser.data.firstName);
    await expect(loginPage.toast.withText(`Sveiki sugrįžę, ${testUser.data.firstName}!`)).toBeVisible();
  });

  test('wrong password shows an error and clears the password field', async ({ loginPage, testUser }) => {
    await loginPage.login(testUser.data.email, 'Wrong123!');

    await expect(loginPage.errorAlert).toHaveText('Neteisingas el. paštas arba slaptažodis.');
    await expect(loginPage.passwordInput).toBeEmpty();
    await expect(loginPage.passwordInput).toBeFocused();
  });

  test('locked account cannot log in', async ({ loginPage }) => {
    await loginPage.login(DEMO_USERS.locked, DEMO_PASSWORD);

    await expect(loginPage.errorAlert).toContainText('užblokuota');
    await expect(loginPage.header.loginLink).toBeVisible();
  });

  test('empty form shows field validation without calling the API', async ({ loginPage, page }) => {
    let loginRequests = 0;
    page.on('request', (req) => {
      if (req.url().endsWith('/api/auth/login')) loginRequests++;
    });

    await loginPage.submitButton.click();

    await expect(loginPage.emailError).toHaveText('Įveskite el. pašto adresą.');
    await expect(loginPage.passwordError).toHaveText('Įveskite slaptažodį.');
    await expect(loginPage.emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(loginRequests).toBe(0);
  });

  test('malformed email is rejected client-side', async ({ loginPage }) => {
    await loginPage.login('jonas@', 'Testas123!');

    await expect(loginPage.emailError).toHaveText('Įveskite teisingą el. pašto adresą.');
  });

  test('redirects back to the requested page after login', async ({ loginPage, testUser, page }) => {
    await loginPage.goto('?redirect=contact.html');

    await loginPage.login(testUser.data.email, testUser.data.password);

    await expect(page).toHaveURL(/contact\.html$/);
  });

  test('a protected page sends a guest to login, then back', async ({ accountPage, loginPage, testUser, page }) => {
    await page.goto('account.html');
    await expect(page).toHaveURL(/login\.html\?redirect=account\.html/);

    await loginPage.login(testUser.data.email, testUser.data.password);

    await expect(page).toHaveURL(/account\.html/);
    await expect(accountPage.greeting).toHaveText(`Sveiki, ${testUser.data.firstName}!`);
  });

  test('logout ends the session', async ({ loginPage, testUser, page }) => {
    await loginPage.login(testUser.data.email, testUser.data.password);
    await expect(loginPage.header.userGreeting).toBeVisible();

    await loginPage.header.logout();

    await expect(loginPage.header.loginLink).toBeVisible();
    await expect(loginPage.toast.withText('Sėkmingai atsijungėte.')).toBeVisible();
    expect((await page.context().cookies()).find((c) => c.name === 'qa_session')).toBeUndefined();
  });
});
