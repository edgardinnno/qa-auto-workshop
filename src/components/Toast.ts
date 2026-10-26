import type { Locator, Page } from '@playwright/test';

/** Transient notifications (bottom of the screen). Success → role=status, error → role=alert. */
export class Toast {
  readonly all: Locator;
  readonly last: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.all = page.getByTestId('toast');
    this.last = this.all.last();
    this.error = page.locator('[data-testid="toast"][data-type="error"]');
  }

  withText(text: string | RegExp): Locator {
    return this.all.filter({ hasText: text });
  }
}
