import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

type Section = 'profile' | 'password' | 'orders';

export class AccountPage extends BasePage {
  protected readonly path = 'account.html';

  readonly greeting: Locator;
  readonly profileTab: Locator;
  readonly passwordTab: Locator;
  readonly ordersTab: Locator;
  readonly ordersCount: Locator;
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly phoneInput: Locator;
  readonly newsletterCheckbox: Locator;
  readonly saveProfileButton: Locator;
  readonly unsavedChangesNote: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly changePasswordButton: Locator;
  readonly passwordErrorAlert: Locator;
  readonly orderRows: Locator;
  readonly ordersEmpty: Locator;

  constructor(page: Page) {
    super(page);
    this.greeting = page.getByTestId('account-greeting');
    const nav = page.getByRole('navigation', { name: 'Paskyros meniu' });
    this.profileTab = nav.getByRole('link', { name: 'Profilis' });
    this.passwordTab = nav.getByRole('link', { name: 'Slaptažodis' });
    this.ordersTab = nav.getByRole('link', { name: /Užsakymai/ });
    this.ordersCount = page.getByTestId('orders-count');
    this.emailInput = page.getByTestId('profile-email');
    this.firstNameInput = page.getByTestId('profile-first-name');
    this.lastNameInput = page.getByTestId('profile-last-name');
    this.phoneInput = page.getByTestId('profile-phone');
    this.newsletterCheckbox = page.getByLabel('Gauti naujienlaiškį');
    this.saveProfileButton = page.getByRole('button', { name: 'Išsaugoti pakeitimus' });
    this.unsavedChangesNote = page.getByTestId('profile-dirty');
    this.currentPasswordInput = page.getByLabel('Dabartinis slaptažodis');
    this.newPasswordInput = page.getByLabel('Naujas slaptažodis', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Pakartokite naują slaptažodį');
    this.changePasswordButton = page.getByRole('button', { name: 'Pakeisti slaptažodį' });
    this.passwordErrorAlert = page.getByTestId('password-error');
    this.orderRows = page.getByTestId('order-row');
    this.ordersEmpty = page.getByTestId('orders-empty');
  }

  async open(section: Section = 'profile') {
    await this.goto(`#${section}`);
  }

  override async waitForLoaded() {
    await this.greeting.waitFor();
  }

  orderRow(orderId: string): Locator {
    return this.page.locator(`[data-testid="order-row"][data-order-id="${orderId}"]`);
  }

  orderStatus(orderId: string): Locator {
    return this.orderRow(orderId).getByTestId('order-row-status');
  }

  async updateProfile(changes: { firstName?: string; lastName?: string; phone?: string }) {
    if (changes.firstName !== undefined) await this.firstNameInput.fill(changes.firstName);
    if (changes.lastName !== undefined) await this.lastNameInput.fill(changes.lastName);
    if (changes.phone !== undefined) await this.phoneInput.fill(changes.phone);
    await this.saveProfileButton.click();
  }

  async changePassword(current: string, next: string, confirm = next) {
    await this.currentPasswordInput.fill(current);
    await this.newPasswordInput.fill(next);
    await this.confirmPasswordInput.fill(confirm);
    await this.changePasswordButton.click();
  }
}
