import type { Locator, Page } from '@playwright/test';
import type { Address, DeliveryMethod, PaymentMethod } from '../api/types';
import { BasePage } from './BasePage';

export interface CardDetails {
  holder: string;
  number: string;
  expiry: string;
  cvc: string;
}

const DELIVERY_LABELS: Record<DeliveryMethod, RegExp> = {
  courier: /Kurjeris į namus/,
  parcel: /^Paštomatas/,
  pickup: /Atsiėmimas parduotuvėje/,
};

const PAYMENT_LABELS: Record<PaymentMethod, RegExp> = {
  card: /Mokėjimo kortelė/,
  bank: /Bankinis pavedimas/,
  cash: /Grynaisiais atsiimant/,
};

/** Four-step wizard: address → delivery → payment → review. */
export class CheckoutPage extends BasePage {
  protected readonly path = 'checkout.html';

  readonly heading: Locator;
  readonly loading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly phoneInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly postalInput: Locator;
  readonly parcelLockerSelect: Locator;
  readonly pickupStoreSelect: Locator;
  readonly cashUnavailableNote: Locator;
  readonly cardHolderInput: Locator;
  readonly cardNumberInput: Locator;
  readonly cardExpiryInput: Locator;
  readonly cardCvcInput: Locator;
  readonly cardBrand: Locator;
  readonly bankSelect: Locator;
  readonly acceptTermsCheckbox: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly placeOrderButton: Locator;
  readonly errorAlert: Locator;
  readonly reviewSummary: Locator;
  readonly total: Locator;
  readonly shipping: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Apmokėjimas', level: 1 });
    this.loading = page.getByTestId('loading');
    this.firstNameInput = page.getByLabel('Vardas', { exact: true });
    this.lastNameInput = page.getByLabel('Pavardė', { exact: true });
    this.phoneInput = page.getByLabel('Telefonas', { exact: true });
    this.streetInput = page.getByLabel('Gatvė, namo ir buto numeris');
    this.cityInput = page.getByLabel('Miestas');
    this.postalInput = page.getByLabel('Pašto kodas');
    this.parcelLockerSelect = page.getByRole('combobox', { name: 'Paštomatas' });
    this.pickupStoreSelect = page.getByRole('combobox', { name: 'Parduotuvė' });
    this.cashUnavailableNote = page.getByTestId('cash-unavailable');
    this.cardHolderInput = page.getByLabel('Kortelės savininkas');
    this.cardNumberInput = page.getByLabel('Kortelės numeris');
    this.cardExpiryInput = page.getByLabel('Galioja iki');
    this.cardCvcInput = page.getByTestId('card-cvc');
    this.cardBrand = page.getByTestId('card-brand');
    this.bankSelect = page.getByRole('combobox', { name: 'Bankas' });
    this.acceptTermsCheckbox = page.getByRole('checkbox', { name: /sutinku su pirkimo taisyklėmis/ });
    this.nextButton = page.getByRole('button', { name: 'Toliau →' });
    this.backButton = page.getByRole('button', { name: '← Atgal' });
    this.placeOrderButton = page.getByRole('button', { name: 'Pateikti užsakymą' });
    this.errorAlert = page.getByTestId('checkout-error');
    this.reviewSummary = page.getByTestId('review-summary');
    const summary = page.getByTestId('checkout-summary');
    this.total = summary.getByTestId('summary-total');
    this.shipping = summary.getByTestId('summary-shipping');
  }

  override async waitForLoaded() {
    await this.loading.waitFor({ state: 'hidden' });
  }

  step(n: 1 | 2 | 3 | 4): Locator {
    return this.page.getByTestId(`stepper-${n}`);
  }

  deliveryOption(method: DeliveryMethod): Locator {
    return this.page.getByRole('radio', { name: DELIVERY_LABELS[method] });
  }

  deliveryPrice(method: DeliveryMethod): Locator {
    return this.page.getByTestId(`delivery-price-${method}`);
  }

  paymentOption(method: PaymentMethod): Locator {
    return this.page.getByRole('radio', { name: PAYMENT_LABELS[method] });
  }

  async fillAddress(address: Address) {
    await this.firstNameInput.fill(address.firstName);
    await this.lastNameInput.fill(address.lastName);
    await this.phoneInput.fill(address.phone);
    await this.streetInput.fill(address.street);
    await this.cityInput.fill(address.city);
    await this.postalInput.fill(address.postal);
    // Commit the field so its on-blur validation renders now, not during the next click
    // (the error message shifts the layout and would swallow that click).
    await this.postalInput.blur();
  }

  async next() {
    await this.nextButton.click();
  }

  async chooseDelivery(method: DeliveryMethod, location?: string) {
    await this.deliveryOption(method).check();
    if (method === 'parcel' && location) await this.parcelLockerSelect.selectOption(location);
    if (method === 'pickup' && location) await this.pickupStoreSelect.selectOption(location);
  }

  async choosePayment(method: PaymentMethod) {
    await this.paymentOption(method).check();
  }

  async fillCard(card: CardDetails) {
    await this.cardHolderInput.fill(card.holder);
    await this.cardNumberInput.fill(card.number);
    await this.cardExpiryInput.fill(card.expiry);
    await this.cardCvcInput.fill(card.cvc);
  }

  async acceptTermsAndPlaceOrder() {
    await this.acceptTermsCheckbox.check();
    await this.placeOrderButton.click();
  }
}
