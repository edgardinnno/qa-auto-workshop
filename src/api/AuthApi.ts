import { BaseApi } from './BaseApi';
import type { RegisterRequest } from './types';

export class AuthApi extends BaseApi {
  register(data: RegisterRequest | Record<string, unknown>) {
    return this.request.post('auth/register', { data });
  }

  login(email: string, password: string, remember = false) {
    return this.request.post('auth/login', { data: { email, password, remember } });
  }

  logout() {
    return this.request.post('auth/logout', { headers: this.headers });
  }
}
