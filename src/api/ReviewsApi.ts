import { BaseApi } from './BaseApi';

export class ReviewsApi extends BaseApi {
  list(productId: string) {
    return this.request.get(`products/${encodeURIComponent(productId)}/reviews`);
  }

  create(productId: string, rating: number, text: string) {
    return this.request.post(`products/${encodeURIComponent(productId)}/reviews`, {
      headers: this.headers,
      data: { rating, text },
    });
  }
}
