import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/** Ensures a trailing slash so relative paths (`cart.html`, `products`) resolve under the base path. */
const withTrailingSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`);

export const env = {
  /** Storefront, e.g. https://edgardinnno.github.io/qa-turgus/ */
  baseUrl: withTrailingSlash(process.env.BASE_URL ?? 'https://edgardinnno.github.io/qa-turgus/'),
  /** REST API root including `/api/`. */
  apiUrl: withTrailingSlash(process.env.API_URL ?? 'https://qa-turgus-api.qa-turgus-api.workers.dev/api/'),
  isCI: Boolean(process.env.CI),
} as const;
