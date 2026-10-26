import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  protected readonly path = 'cart.html';

  readonly heading: Locator;
  readonly items: Locator;
  readonly itemsCount: Locator;
  readonly emptyState: Locator;
  readonly loading: Locator;
  readonly clearCartButton: Locator;
  readonly promoInput: Locator;
  readonly applyPromoButton: Locator;
  readonly promoError: Locator;
  readonly appliedPromoCode: Locator;
  readonly removePromoButton: Locator;
  readonly freeShipping: Locator;
  readonly freeShippingLeft: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly shipping: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Pirkinių krepšelis' });
    this.items = page.getByTestId('cart-item');
    this.itemsCount = page.getByTestId('cart-items-count');
    this.emptyState = page.getByTestId('cart-empty');
    this.loading = page.getByTestId('loading');
    this.clearCartButton = page.getByRole('button', { name: 'Išvalyti krepšelį' });
    this.promoInput = page.getByLabel('Nuolaidos kodas');
    this.applyPromoButton = page.getByRole('button', { name: 'Pritaikyti' });
    this.promoError = page.getByTestId('promo-error');
    this.appliedPromoCode = page.getByTestId('promo-applied-code');
    this.removePromoButton = page.getByRole('button', { name: 'Pašalinti nuolaidos kodą' });
    this.freeShipping = page.getByTestId('free-shipping');
    this.freeShippingLeft = page.getByTestId('free-shipping-left');
    const summary = page.getByTestId('cart-summary');
    this.subtotal = summary.getByTestId('summary-subtotal');
    this.discount = summary.getByTestId('summary-discount');
    this.shipping = summary.getByTestId('summary-shipping');
    this.total = summary.getByTestId('summary-total');
    this.checkoutButton = page.getByRole('button', { name: 'Pereiti prie apmokėjimo' });
  }

  override async waitForLoaded() {
    await this.loading.waitFor({ state: 'hidden' });
  }

  item(name: string): Locator {
    return this.items.filter({ has: this.page.getByTestId('cart-item-name').filter({ hasText: name }) });
  }

  quantityInput(name: string): Locator {
    return this.page.getByRole('spinbutton', { name: `Kiekis: ${name}` });
  }

  itemTotal(name: string): Locator {
    return this.item(name).getByTestId('cart-item-total');
  }

  async increaseQuantity(name: string) {
    await this.page.getByRole('button', { name: `Padidinti kiekį: ${name}` }).click();
  }

  async decreaseQuantity(name: string) {
    await this.page.getByRole('button', { name: `Sumažinti kiekį: ${name}` }).click();
  }

  /** Typing a quantity commits on `change`, i.e. when the field loses focus. */
  async setQuantity(name: string, quantity: number) {
    await this.quantityInput(name).fill(String(quantity));
    await this.quantityInput(name).blur();
  }

  /** Opens the app's confirmation modal; confirm or cancel it via `confirmDialog`. */
  async clickRemove(name: string) {
    await this.page.getByRole('button', { name: `Pašalinti: ${name}` }).click();
  }

  async removeItem(name: string) {
    await this.clickRemove(name);
    await this.confirmDialog.confirm();
  }

  /** "Clear cart" uses the browser's native `confirm()`, so the dialog must be handled before clicking. */
  async clearCart({ accept = true } = {}) {
    this.page.once('dialog', (dialog) => (accept ? dialog.accept() : dialog.dismiss()));
    await this.clearCartButton.click();
  }

  async applyPromo(code: string) {
    await this.promoInput.fill(code);
    await this.applyPromoButton.click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}
