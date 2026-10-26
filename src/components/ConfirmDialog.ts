import type { Locator, Page } from '@playwright/test';

/** The app's custom modal (not the native `confirm()`), used for removing items and cancelling orders. */
export class ConfirmDialog {
  readonly root: Locator;
  readonly title: Locator;
  readonly message: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog');
    this.title = this.root.getByRole('heading');
    this.message = this.root.locator('#modal-text');
    this.confirmButton = this.root.getByTestId('confirm-ok');
    this.cancelButton = this.root.getByTestId('confirm-cancel');
  }

  async confirm() {
    await this.confirmButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
