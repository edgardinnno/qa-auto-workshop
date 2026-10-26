import type { Locator, Page } from '@playwright/test';

/** Site header shared by every page: navigation, cart badge and the user menu. */
export class Header {
  readonly root: Locator;
  readonly logo: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly loginLink: Locator;
  readonly registerLink: Locator;
  readonly userMenuButton: Locator;
  readonly userGreeting: Locator;
  readonly userEmail: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.root = page.locator('#site-header');
    this.logo = this.root.getByTestId('logo');
    this.cartLink = this.root.getByRole('link', { name: 'Krepšelis' });
    this.cartBadge = this.root.getByTestId('cart-badge');
    this.loginLink = this.root.getByRole('link', { name: 'Prisijungti' });
    this.registerLink = this.root.getByRole('link', { name: 'Registruotis' });
    this.userMenuButton = this.root.getByTestId('user-menu-button');
    this.userGreeting = this.root.getByTestId('user-greeting');
    this.userEmail = this.root.getByTestId('user-email');
    this.logoutButton = this.root.getByRole('menuitem', { name: 'Atsijungti' });
  }

  async openCart() {
    await this.cartLink.click();
  }

  async openUserMenu() {
    await this.userMenuButton.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
  }
}
