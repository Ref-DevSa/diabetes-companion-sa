# Diabetes Companion SA

A free, mobile-first web app that helps South African adults with Type 2 diabetes learn about diabetes, save glucose Readings (mmol/L) in a Diary and tick a daily care Checklist. Visitors and family members can read the Learning Centre, the Safety Guide and trusted South African Resources without an account. The app informs and records only: it gives no diagnosis, treatment or medication advice.

* Requirements: [docs/PRD.md](docs/PRD.md) (v0.4)
* Build plan and progress: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
* Screen designs: [docs/designs/](docs/designs/), one folder per screen or pop-up with `code.html` and `screen.png` (design reference; the PRD wins where they differ, see plan Section 7.3)

**Stack:** React 19, TypeScript 5, Vite 7, React Router 7, Tailwind CSS 4, react-i18next, Supabase (PostgreSQL, Auth, Row-Level Security). Tests: Vitest, React Testing Library, pgTAP, Playwright with axe-core.

## Set up (first time)

You need: Node.js 22 or 24 LTS with npm, Git, and Docker Desktop (running) for the local Supabase.

```bash
npm install
npx playwright install chromium
cp .env.example .env          # then fill in the values below
npm run db:start              # starts the local Supabase in Docker (first run downloads images)
npx supabase status           # shows the local API URL and keys
```

Put these in `.env` (never commit it; it is in `.gitignore`):

| Variable | Value |
|-|-|
| `VITE_SUPABASE_URL` | the local **API URL** from `npx supabase status` (normally `http://127.0.0.1:54321`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the local **publishable** (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | the local **secret** (service role) key, used only by the seed script and test helpers |
| `TEST_USER_PASSWORD` | the test-only password written in the PRD PDF, section 10.4 |
| `E2E_BASE_URL` | `http://localhost:5173` |

Then reset the database (migrations, seed data and test accounts) and start the app:

```bash
npm run db:reset
npm run dev                   # http://localhost:5173
```

To try it on a real phone on the same Wi-Fi: run `npm run dev -- --host`, use the computer's Wi-Fi IP address in `VITE_SUPABASE_URL`, and add that address to `additional_redirect_urls` in `supabase/config.toml`.

## Commands

| Purpose | Command |
|-|-|
| Install dependencies | `npm install` |
| Start / stop the local backend | `npm run db:start` / `npm run db:stop` |
| Reset the database (migrations + seed + test accounts) | `npm run db:reset` |
| Start the app | `npm run dev` |
| Unit tests | `npm run test:unit` |
| Component tests | `npm run test:component` |
| Database and permission tests (pgTAP) | `npm run test:db` |
| Integration tests (local Supabase) | `npm run test:int` |
| End-to-end tests (Playwright; starts the app itself) | `npm run test:e2e` |
| Lint / type check | `npm run lint` / `npm run typecheck` |
| Secret scan | `npm run scan:secrets` |
| Coverage for business rules (`src/lib/`) | `npm run test:coverage` |
| **Full check** (run before every "done") | `npm run check` |
| Regenerate database types | `npm run types` |
| Production build | `npm run build` |

`npm run check` runs lint, type check, secret scan, unit, component, database, integration and end-to-end tests in that order and stops at the first failure. Docker must be running and the database reset first.

Run one test by its ID, for example `npx vitest run -t "T-C-4"` or `npx playwright test -g "T-SETUP-8"`.

## Test accounts (local only)

Created by `npm run db:reset` (script `scripts/seed-users.mjs`, which refuses to run against anything but localhost). All use the test-only password in your `.env`.

| Email | Language | Notes |
|-|-|-|
| thabo.test@example.co.za | Setswana | Has the five sample Readings and the Checklist state from PRD 8.4 |
| nomsa.test@example.co.za | isiZulu | No Readings (empty states, permission tests) |
| sipho.test@example.co.za | English | No Readings (sign-up and reset tests) |

The accounts and their data are added in Phase 2. Emails sent by the local Supabase (confirmation, password reset) are caught by the local email catcher; its address is shown by `npx supabase status`.

## Security rules in short

* Never put a secret key or password in code, tests, logs or Git. `npm run scan:secrets` checks this.
* The app uses only the public (publishable) key; every permission is enforced in the database with Row-Level Security.
* `BREVO_SMTP_KEY` is typed only into the Supabase dashboard, never into this repository.

## Project documents

* [docs/PRIVACY_AND_ADMIN.md](docs/PRIVACY_AND_ADMIN.md): admin access, deletion, retention and backups
* [docs/ADMIN_ACCESS_LOG.md](docs/ADMIN_ACCESS_LOG.md): one row each time the admin opens personal data
* [docs/CONTENT_REVIEW_LOG.md](docs/CONTENT_REVIEW_LOG.md): health content and translation reviews
* [docs/LAUNCH_GATES.md](docs/LAUNCH_GATES.md): what must be done before release
