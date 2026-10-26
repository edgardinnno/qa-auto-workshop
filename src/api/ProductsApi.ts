import { BaseApi } from './BaseApi';
import type { ProductQuery } from './types';

export class ProductsApi extends BaseApi {
  list(query: ProductQuery | Record<string, string | number | boolean> = {}) {
    const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined));
    return this.request.get('products', { params });
  }

  get(id: string) {
    return this.request.get(`products/${encodeURIComponent(id)}`);
  }

  categories() {
    return this.request.get('categories');
  }
}
