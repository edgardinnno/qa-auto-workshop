import { expect, type APIResponse } from '@playwright/test';
import type { ApiErrorBody } from '../api/types';

/**
 * Asserts a 2xx response (or the exact `status`) and returns the parsed JSON body.
 * On failure Playwright prints the response body, which makes API failures easy to debug.
 */
export async function parseOk<T>(res: APIResponse, status?: number): Promise<T> {
  if (status === undefined) await expect(res).toBeOK();
  else expect(res.status(), `${res.url()} → ${await res.text()}`).toBe(status);
  return (await res.json()) as T;
}

/**
 * Asserts the API's uniform error envelope: `{ error: { code, message, details? } }`.
 * `details` is checked as a subset, so you only list the fields the case is about.
 */
export async function expectApiError(
  res: APIResponse,
  status: number,
  code: string,
  details?: Record<string, string | RegExp>,
): Promise<ApiErrorBody['error']> {
  expect(res.status(), `${res.url()} → ${await res.text()}`).toBe(status);
  const { error } = (await res.json()) as ApiErrorBody;
  expect(error.code).toBe(code);
  expect(error.message).toBeTruthy();
  if (details) {
    for (const [field, message] of Object.entries(details)) {
      expect(error.details?.[field], `details.${field}`).toMatch(message);
    }
  }
  return error;
}
