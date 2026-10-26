import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  protected readonly path = 'product.html';

  readonly detail: Locator;
  readonly title: Locator;
  readonly price: Locator;
  readonly stockStatus: Locator;
  readonly selectedColor: Locator;
  readonly sizeSelect: Locator;
  readonly sizeError: Locator;
  readonly quantityInput: Locator;
  readonly quantityError: Locator;
  readonly increaseQuantityButton: Locator;
  readonly addToCartButton: Locator;
  readonly notFound: Locator;
  readonly loading: Locator;

  constructor(page: Page) {
    super(page);
    this.detail = page.getByTestId('product-detail');
    this.title = this.detail.getByRole('heading', { level: 1 });
    this.price = this.detail.getByTestId('product-price');
    this.stockStatus = this.detail.getByTestId('stock-status');
    this.selectedColor = this.detail.getByTestId('selected-color');
    this.sizeSelect = this.detail.getByLabel('Dydis');
    this.sizeError = this.detail.getByTestId('size-error');
    this.quantityInput = this.detail.getByLabel('Kiekis', { exact: true });
    this.quantityError = this.detail.getByTestId('qty-error');
    this.increaseQuantityButton = this.detail.getByRole('button', { name: 'Padidinti kiekį' });
    this.addToCartButton = this.detail.getByTestId('add-to-cart');
    this.notFound = page.getByTestId('not-found');
    this.loading = page.getByTestId('loading');
  }

  async open(productId: string) {
    await this.goto(`?id=${encodeURIComponent(productId)}`);
  }

  override async waitForLoaded() {
    await this.loading.waitFor({ state: 'hidden' });
  }

  tab(name: 'Aprašymas' | 'Specifikacijos' | RegExp): Locator {
    return this.page.getByRole('tab', { name });
  }

  colorOption(color: string): Locator {
    return this.detail.getByRole('radio', { name: color });
  }

  async chooseColor(color: string) {
    await this.colorOption(color).check();
  }

  async chooseSize(size: string) {
    await this.sizeSelect.selectOption(size);
  }

  async setQuantity(quantity: number) {
    await this.quantityInput.fill(String(quantity));
  }

  async addToCart() {
    await this.addToCartButton.click();
  }
}
