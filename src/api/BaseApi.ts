import type { APIRequestContext } from '@playwright/test';

/**
 * Base for endpoint groups. Methods return the raw `APIResponse` so specs can assert
 * on status codes and error bodies; use `parseOk()` when you just need the payload.
 *
 * Paths are relative (no leading slash) so they resolve under the `/api/` base URL.
 */
export abstract class BaseApi {
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly token?: string,
  ) {}

  protected get headers(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}
