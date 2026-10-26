# QA Turgus — Playwright test automation

E2E (UI) and API tests in TypeScript for the [QA Turgus](https://edgardinnno.github.io/qa-turgus/) practice shop,
built with Page Object Model, custom fixtures and Playwright best practices.

|            |                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Storefront | https://edgardinnno.github.io/qa-turgus/                                                       |
| REST API   | https://qa-turgus-api.qa-turgus-api.workers.dev/api — docs at `/docs`, spec at `/openapi.json` |

## Quick start

Requires Node.js 20+.

```bash
npm ci
npx playwright install chromium
cp .env.example .env        # optional — defaults point at the public instance

npm test                    # everything
npm run test:api            # API only (fast, no browser)
npm run test:e2e            # UI only
npm run test:smoke          # @smoke subset
npm run test:ui             # interactive UI mode
npm run report              # open the last HTML report
```

Code quality: `npm run typecheck`, `npm run lint`, `npm run format`, `npm run check:ids`.

## Project layout

```
src/
  config/env.ts        BASE_URL / API_URL with defaults (.env supported)
  api/                 ApiClient + one class per endpoint group, types, vendored openapi.json
  pages/               Page objects (one per page), all extend BasePage
  components/          UI parts shared by pages: Header, ConfirmDialog, Toast, CookieBanner, ProductCard
  fixtures/            api.fixture (api, testUser, createUser), auth.fixture (loggedInUser, cookieConsent),
                       pages.fixture (catalogPage, cartPage, …), index.ts merges them
  data/                constants (demo users, promo codes, cards, products) and factories (buildUser, …)
  utils/               parseOk / expectApiError, expectSchema (Ajv against openapi.json)
tests/
  api/                 API specs — run in the `api` project
  e2e/                 UI specs — run in the `e2e-chromium` project
```

## Conventions

**Imports.** Specs import `test` and `expect` only from `src/fixtures`:

```ts
import { expect, test } from '../../src/fixtures';
```

**Test data and isolation.** The demo accounts are shared and read-only, so any test that changes state uses the
`testUser` fixture: a fresh user is registered through the API and deleted after the test, even if it fails. For
multi-user scenarios use `createUser()`. Use demo users only for their special behaviour (locked, slow, 500).

**Logged-in UI tests.** Request `loggedInUser` instead of filling the login form. It injects the session cookie
(`qa_session`) and `localStorage.qa_user` before the page loads:

```ts
test('…', async ({ loggedInUser, cartPage }) => {
  await loggedInUser.api.cart.addItem({ productId: 'p11' }); // arrange via API
  await cartPage.goto(); // act + assert in the UI
});
```

**Page objects.**

- Locators are `readonly` fields set in the constructor.
- Methods describe user intent (`applyPromo(code)`, `removeItem(name)`).
- Page objects make no assertions. They only wait for loading in `waitForLoaded()`, and specs assert with web-first `expect(locator)`.
- Locator priority: `getByRole` / `getByLabel`, then `getByTestId` when labels are ambiguous or decorated. No CSS/XPath unless unavoidable.

**API tests.** Clients return the raw `APIResponse`. Use `parseOk<T>(res, status)` to assert success and get the body,
`expectApiError(res, status, code, details)` for the uniform error envelope, and `expectSchema(body, 'User')` for
contract checks against `src/api/openapi.json`. Refresh that file deliberately when the API contract changes.

**Stability.**

- No `waitForTimeout`. Wait for the API call an action triggers (`BasePage.waitForApi`) or use auto-retrying assertions.
- Mock the network with `page.route()` for states the real server can't produce on demand, such as errors or offline.
- Tests must pass in any order and in parallel. Check this with `npx playwright test --repeat-each=3`.

**Test IDs.** Every test name starts with a permanent ID: `TC-012: locked account cannot log in`.

- A new test takes the next free number (`npm run check:ids` prints the highest one in use).
- IDs are never renumbered or reused. When a test is deleted, its ID is retired.
- Data-driven tests carry the ID in each data row (`{ id: 'TC-007', name: …}`), and the name is built as `` `${id}: …` ``.
- Run one test by its ID: `npx playwright test -g "TC-012"`.
- `npm run check:ids` (also part of the CI lint stage) fails on a missing or duplicate ID.

**Tags.** Add `{ tag: '@smoke' }` to the critical paths. Every describe block also carries `@api` or `@e2e`.

### Adding a page object

1. Create `src/pages/XPage.ts` extending `BasePage`. Set `path` and override `waitForLoaded()` if the page loads data.
2. Register it in `src/fixtures/pages.fixture.ts`.
3. Use it in specs as a fixture: `async ({ xPage }) => …`.

## Known app behaviour worth knowing

- **Clicks lost to layout shift.** Several forms validate a field on blur and insert an error message under it. If a
  click is what triggers that blur, the message pushes the target down mid-click and the click is lost. Real users hit
  this too. The page objects commit the last text field (`blur()`) before clicking on, so tests stay deterministic.
- **Shared server.** Stock never decreases. Reviews and orders from all users live in one database, so never assume
  you are the only writer (for example, don't assume your review is first in the list).

## CI (GitLab)

`.gitlab-ci.yml` follows GitLab's build → test → deploy layout. It runs on merge requests, the default branch,
schedules and manual runs.

| Stage  | Job                     | What it does                                                                  |
| ------ | ----------------------- | ----------------------------------------------------------------------------- |
| build  | `build-job`             | `npm ci`, then typecheck, ESLint, Prettier and the test-ID check              |
| test   | `api-test-job`          | API tests                                                                     |
| test   | `e2e-test-job` 1/2, 2/2 | Browser tests, split across 2 parallel jobs                                   |
| deploy | `report-job`            | Merges all results into one HTML report (every pipeline, even after failures) |
| deploy | `pages`                 | Publishes that report to GitLab Pages (default branch only)                   |

- JUnit results show in the pipeline's **Tests** tab and in the merge request widget.
- The merged HTML report is a job artifact (**Playwright report** link in MRs).
- On `main`, the latest report is also published at `https://<username>.gitlab.io/qa-auto-workshop/` (see
  **Deploy → Pages** for the exact URL, and **Operate → Environments → test-report**).
- Optional CI/CD variables: `BASE_URL`, `API_URL`, and `TEST_GREP` (for example `@smoke` or `TC-012`).
- Set up a pipeline schedule for a nightly full run.
- Keep the Docker image tag in sync with `@playwright/test` when upgrading.
