import { BaseApi } from './BaseApi';
import type { OrderRequest } from './types';

export class OrdersApi extends BaseApi {
  list() {
    return this.request.get('orders', { headers: this.headers });
  }

  get(id: string) {
    return this.request.get(`orders/${encodeURIComponent(id)}`, { headers: this.headers });
  }

  create(order: OrderRequest | Record<string, unknown>) {
    return this.request.post('orders', { headers: this.headers, data: order });
  }

  cancel(id: string) {
    return this.request.post(`orders/${encodeURIComponent(id)}/cancel`, { headers: this.headers });
  }
}
