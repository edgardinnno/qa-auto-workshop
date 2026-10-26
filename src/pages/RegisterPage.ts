import type { Locator, Page } from '@playwright/test';
import type { RegisterRequest } from '../api/types';
import { BasePage } from './BasePage';

export type RegisterField =
  'first-name' | 'last-name' | 'birth-date' | 'country' | 'email' | 'phone' | 'password' | 'password-confirm' | 'terms';

export type PasswordRule = 'length' | 'upper' | 'lower' | 'digit' | 'special';

export interface RegistrationForm extends RegisterRequest {
  passwordConfirm?: string;
  acceptTerms?: boolean;
}

/** Labels carry a decorative `*`, so inputs are located by their stable test ids. */
export class RegisterPage extends BasePage {
  protected readonly path = 'register.html';

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly birthDateInput: Locator;
  readonly countrySelect: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordConfirmInput: Locator;
  readonly newsletterCheckbox: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly passwordStrengthLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('register-first-name');
    this.lastNameInput = page.getByTestId('register-last-name');
    this.birthDateInput = page.getByTestId('register-birth-date');
    this.countrySelect = page.getByTestId('register-country');
    this.emailInput = page.getByTestId('register-email');
    this.phoneInput = page.getByTestId('register-phone');
    this.passwordInput = page.getByTestId('register-password');
    this.passwordConfirmInput = page.getByTestId('register-password-confirm');
    this.newsletterCheckbox = page.getByTestId('register-newsletter');
    this.termsCheckbox = page.getByTestId('register-terms');
    this.submitButton = page.getByRole('button', { name: 'Sukurti paskyrą' });
    this.errorAlert = page.getByTestId('register-error');
    this.passwordStrengthLabel = page.getByTestId('password-strength-label');
  }

  fieldError(field: RegisterField): Locator {
    return this.page.getByTestId(`register-${field}-error`);
  }

  passwordRule(rule: PasswordRule): Locator {
    return this.page.getByTestId(`password-rule-${rule}`);
  }

  async fillForm(form: RegistrationForm) {
    await this.firstNameInput.fill(form.firstName);
    await this.lastNameInput.fill(form.lastName);
    await this.birthDateInput.fill(form.birthDate);
    await this.countrySelect.selectOption(form.country);
    await this.emailInput.fill(form.email);
    if (form.phone) await this.phoneInput.fill(form.phone);
    await this.passwordInput.fill(form.password);
    await this.passwordConfirmInput.fill(form.passwordConfirm ?? form.password);
    // Commit the last text field before clicking further: its on-blur error message shifts the layout,
    // and a click that triggers that blur lands on the moved element and is lost.
    await this.passwordConfirmInput.blur();
    if (form.newsletter) await this.newsletterCheckbox.check();
    if (form.acceptTerms ?? true) await this.termsCheckbox.check();
  }

  async submit() {
    await this.submitButton.click();
  }

  async register(form: RegistrationForm) {
    await this.fillForm(form);
    await this.submit();
  }
}
