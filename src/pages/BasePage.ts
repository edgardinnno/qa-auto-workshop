import type { Page, Response } from '@playwright/test';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Header } from '../components/Header';
import { Toast } from '../components/Toast';

export abstract class BasePage {
  readonly header: Header;
  readonly toast: Toast;
  readonly confirmDialog: ConfirmDialog;

  /** Path relative to BASE_URL, e.g. `cart.html`. */
  protected abstract readonly path: string;

  constructor(readonly page: Page) {
    this.header = new Header(page);
    this.toast = new Toast(page);
    this.confirmDialog = new ConfirmDialog(page);
  }

  /** Navigates to the page. `query` is appended as-is, e.g. `?id=p11` or `#orders`. */
  async goto(query = '') {
    await this.page.goto(`${this.path}${query}`);
    await this.waitForLoaded();
  }

  /** Override to wait for the page's async content (API data) to render. */
  async waitForLoaded(): Promise<void> {}

  /**
   * Runs `action` and resolves with the matching API response, avoiding the
   * race of starting to wait after the request has already been sent.
   */
  protected async waitForApi(
    pathSuffix: string | RegExp,
    action: () => Promise<unknown>,
    method = 'GET',
  ): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => {
        const { pathname } = new URL(res.url());
        const matches =
          typeof pathSuffix === 'string' ? pathname.endsWith(`/api/${pathSuffix}`) : pathSuffix.test(pathname);
        return matches && res.request().method() === method;
      }),
      action(),
    ]);
    return response;
  }
}
