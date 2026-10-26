import { test as base } from '@playwright/test';
import { CookieBanner } from '../components/CookieBanner';
import { AccountPage } from '../pages/AccountPage';
import { CartPage } from '../pages/CartPage';
import { CatalogPage } from '../pages/CatalogPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ContactPage } from '../pages/ContactPage';
import { LoginPage } from '../pages/LoginPage';
import { OrderPage } from '../pages/OrderPage';
import { ProductPage } from '../pages/ProductPage';
import { RegisterPage } from '../pages/RegisterPage';

export interface PageFixtures {
  catalogPage: CatalogPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderPage: OrderPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  accountPage: AccountPage;
  contactPage: ContactPage;
  cookieBanner: CookieBanner;
}

/** One fixture per page object, so specs never call `new XPage(page)`. */
export const test = base.extend<PageFixtures>({
  catalogPage: async ({ page }, use) => use(new CatalogPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  orderPage: async ({ page }, use) => use(new OrderPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  contactPage: async ({ page }, use) => use(new ContactPage(page)),
  cookieBanner: async ({ page }, use) => use(new CookieBanner(page)),
});
