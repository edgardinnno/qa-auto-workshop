import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from './AuthApi';
import { CartApi } from './CartApi';
import { MiscApi } from './MiscApi';
import { OrdersApi } from './OrdersApi';
import { ProductsApi } from './ProductsApi';
import { ReviewsApi } from './ReviewsApi';
import { UsersApi } from './UsersApi';

/**
 * Single entry point to the QA Turgus REST API.
 *
 * @example
 *   const res = await api.products.list({ sort: 'price-asc' });
 *   const authed = api.withToken(token);
 *   await authed.cart.addItem({ productId: 'p11' });
 */
export class ApiClient {
  readonly auth: AuthApi;
  readonly users: UsersApi;
  readonly products: ProductsApi;
  readonly reviews: ReviewsApi;
  readonly cart: CartApi;
  readonly orders: OrdersApi;
  readonly misc: MiscApi;

  constructor(
    private readonly request: APIRequestContext,
    readonly token?: string,
  ) {
    this.auth = new AuthApi(request, token);
    this.users = new UsersApi(request, token);
    this.products = new ProductsApi(request, token);
    this.reviews = new ReviewsApi(request, token);
    this.cart = new CartApi(request, token);
    this.orders = new OrdersApi(request, token);
    this.misc = new MiscApi(request, token);
  }

  /** Same client, authenticated with a Bearer token. */
  withToken(token: string): ApiClient {
    return new ApiClient(this.request, token);
  }
}
