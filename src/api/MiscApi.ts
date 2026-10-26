import { BaseApi } from './BaseApi';
import type { ContactMessageRequest } from './types';

/** Public endpoints that don't belong to a resource group. */
export class MiscApi extends BaseApi {
  health() {
    return this.request.get('health');
  }

  config() {
    return this.request.get('config');
  }

  validatePromo(code: string, subtotal?: number) {
    return this.request.post('promo-codes/validate', { data: { code, subtotal } });
  }

  sendContactMessage(message: ContactMessageRequest | Record<string, unknown>) {
    return this.request.post('contact-messages', { data: message });
  }
}
