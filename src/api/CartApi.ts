import { BaseApi } from './BaseApi';
import type { AddCartItemRequest } from './types';

export class CartApi extends BaseApi {
  get() {
    return this.request.get('cart', { headers: this.headers });
  }

  clear() {
    return this.request.delete('cart', { headers: this.headers });
  }

  addItem(item: AddCartItemRequest) {
    return this.request.post('cart/items', { headers: this.headers, data: item });
  }

  updateItem(itemId: number | string, quantity: number) {
    return this.request.patch(`cart/items/${itemId}`, { headers: this.headers, data: { quantity } });
  }

  removeItem(itemId: number | string) {
    return this.request.delete(`cart/items/${itemId}`, { headers: this.headers });
  }

  applyPromo(code: string) {
    return this.request.post('cart/promo', { headers: this.headers, data: { code } });
  }

  removePromo() {
    return this.request.delete('cart/promo', { headers: this.headers });
  }
}
