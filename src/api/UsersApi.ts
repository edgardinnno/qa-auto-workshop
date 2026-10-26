import { BaseApi } from './BaseApi';
import type { User } from './types';

type ProfileChanges = Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'newsletter'>>;

export class UsersApi extends BaseApi {
  me() {
    return this.request.get('users/me', { headers: this.headers });
  }

  update(changes: ProfileChanges | Record<string, unknown>) {
    return this.request.patch('users/me', { headers: this.headers, data: changes });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.request.put('users/me/password', { headers: this.headers, data: { currentPassword, newPassword } });
  }

  deleteMe() {
    return this.request.delete('users/me', { headers: this.headers });
  }
}
