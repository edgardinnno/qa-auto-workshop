import type { Locator, Page } from '@playwright/test';
import { ProductCard } from '../components/ProductCard';
import type { Category, SortOption } from '../data/constants';
import { BasePage } from './BasePage';

export class CatalogPage extends BasePage {
  protected readonly path = 'index.html';

  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly sortSelect: Locator;
  readonly inStockCheckbox: Locator;
  readonly resultsCount: Locator;
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly loading: Locator;
  readonly emptyState: Locator;
  readonly clearFiltersButton: Locator;
  readonly loadError: Locator;
  readonly retryButton: Locator;
  readonly pagination: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole('searchbox', { name: 'Paieška' });
    this.categorySelect = page.getByLabel('Kategorija');
    this.sortSelect = page.getByLabel('Rikiuoti');
    this.inStockCheckbox = page.getByLabel('Tik turimos prekės');
    this.resultsCount = page.getByTestId('results-count');
    this.productGrid = page.getByTestId('product-grid');
    this.productCards = this.productGrid.getByTestId('product-card');
    this.productNames = this.productGrid.getByTestId('product-name');
    this.productPrices = this.productGrid.getByTestId('product-price');
    this.loading = page.getByTestId('loading');
    this.emptyState = page.getByTestId('empty-state');
    this.clearFiltersButton = page.getByRole('button', { name: 'Išvalyti filtrus' });
    this.loadError = page.getByTestId('load-error');
    this.retryButton = page.getByRole('button', { name: 'Bandyti dar kartą' });
    this.pagination = page.getByRole('navigation', { name: 'Puslapiavimas' });
    this.nextPageButton = page.getByTestId('page-next');
    this.previousPageButton = page.getByTestId('page-prev');
  }

  override async goto(query = '') {
    await this.waitForApi('products', () => this.page.goto(`${this.path}${query}`));
    await this.waitForLoaded();
  }

  override async waitForLoaded() {
    await this.loading.waitFor({ state: 'hidden' });
  }

  productCard(name: string | RegExp): ProductCard {
    return new ProductCard(
      this.productCards.filter({ has: this.page.getByTestId('product-name').filter({ hasText: name }) }),
    );
  }

  pageButton(n: number): Locator {
    return this.pagination.getByTestId(`page-${n}`);
  }

  /** Search is debounced (300 ms) and server-side, so wait for the request it triggers. */
  async search(text: string) {
    await this.waitForApi('products', () => this.searchInput.fill(text));
    await this.waitForLoaded();
  }

  async filterByCategory(category: Category | '') {
    await this.waitForApi('products', () => this.categorySelect.selectOption(category));
    await this.waitForLoaded();
  }

  async sortBy(option: SortOption) {
    await this.waitForApi('products', () => this.sortSelect.selectOption(option));
    await this.waitForLoaded();
  }

  async showOnlyInStock() {
    await this.waitForApi('products', () => this.inStockCheckbox.check());
    await this.waitForLoaded();
  }

  async goToPage(n: number) {
    await this.waitForApi('products', () => this.pageButton(n).click());
    await this.waitForLoaded();
  }

  async clearFilters() {
    await this.waitForApi('products', () => this.clearFiltersButton.click());
    await this.waitForLoaded();
  }

  /** Prices as numbers, read from the `data-value` attribute rather than the formatted "9,99 €" text. */
  async priceValues(): Promise<number[]> {
    const values = await this.productPrices.evaluateAll((els) => els.map((el) => el.getAttribute('data-value')));
    return values.map(Number);
  }
}
