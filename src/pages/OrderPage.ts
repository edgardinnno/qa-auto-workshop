import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class OrderPage extends BasePage {
  protected readonly path = 'order.html';

  readonly successBanner: Locator;
  readonly orderNumber: Locator;
  readonly status: Locator;
  readonly total: Locator;
  readonly items: Locator;
  readonly payment: Locator;
  readonly cancelOrderButton: Locator;
  readonly notFound: Locator;
  readonly loading: Locator;

  constructor(page: Page) {
    super(page);
    this.successBanner = page.getByTestId('order-success');
    this.orderNumber = page.getByTestId('order-number');
    this.status = page.getByTestId('order-status');
    this.total = page.getByTestId('order-total');
    this.items = page.getByTestId('order-item');
    this.payment = page.getByTestId('order-payment');
    this.cancelOrderButton = page.getByRole('button', { name: 'Atšaukti užsakymą' });
    this.notFound = page.getByTestId('order-not-found');
    this.loading = page.getByTestId('loading');
  }

  async open(orderId: string) {
    await this.goto(`?id=${encodeURIComponent(orderId)}`);
  }

  override async waitForLoaded() {
    await this.loading.waitFor({ state: 'hidden' });
  }

  async cancelOrder() {
    await this.cancelOrderButton.click();
    await this.confirmDialog.confirm();
  }
}
