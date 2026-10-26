import type { Locator } from '@playwright/test';

/** One product tile in the catalog grid. Built from the card's root locator. */
export class ProductCard {
  readonly name: Locator;
  readonly price: Locator;
  readonly oldPrice: Locator;
  readonly stockBadge: Locator;
  readonly addToCartButton: Locator;
  readonly chooseOptionsLink: Locator;

  constructor(readonly root: Locator) {
    this.name = root.getByTestId('product-name');
    this.price = root.getByTestId('product-price');
    this.oldPrice = root.getByTestId('product-old-price');
    this.stockBadge = root.getByTestId('stock-badge');
    this.addToCartButton = root.getByTestId('add-to-cart');
    this.chooseOptionsLink = root.getByRole('link', { name: 'Pasirinkti dydį' });
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async open() {
    await this.name.click();
  }
}
