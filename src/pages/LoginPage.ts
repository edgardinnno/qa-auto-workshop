import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  protected readonly path = 'login.html';

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberCheckbox: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly infoAlert: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Prisijungimas' });
    this.emailInput = page.getByLabel('El. paštas', { exact: true });
    this.passwordInput = page.getByLabel('Slaptažodis', { exact: true });
    this.rememberCheckbox = page.getByLabel('Prisiminti mane 7 dienas');
    this.submitButton = page.getByRole('button', { name: 'Prisijungti' });
    this.errorAlert = page.getByTestId('login-error');
    this.infoAlert = page.getByTestId('login-info');
    this.emailError = page.getByTestId('login-email-error');
    this.passwordError = page.getByTestId('login-password-error');
    this.registerLink = page.getByTestId('go-to-register');
  }

  async login(email: string, password: string, { remember = false } = {}) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (remember) await this.rememberCheckbox.check();
    await this.submitButton.click();
  }
}
