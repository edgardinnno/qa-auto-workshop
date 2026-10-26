import type { Locator, Page } from '@playwright/test';

/** Appears ~0.8 s after load unless consent is already stored. */
export class CookieBanner {
  readonly root: Locator;
  readonly acceptButton: Locator;
  readonly necessaryOnlyButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('region', { name: 'Slapukų sutikimas' });
    this.acceptButton = this.root.getByRole('button', { name: 'Sutinku' });
    this.necessaryOnlyButton = this.root.getByRole('button', { name: 'Tik būtinieji' });
  }

  async accept() {
    await this.acceptButton.click();
  }
}
