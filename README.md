# Convergence Form Extractor

Convergence Form Extractor is an AI-assisted creativity studio for practicing divergent thinking, monitoring creative momentum, and reviewing assessed sessions over time. It combines guided creativity exercises, a diagnostic assessment, an AI Muse playground, cognitive telemetry, and a verification ledger.

## Features

- A catalog of guided creativity exercises and custom prompts
- A diagnostic creativity assessment
- Live cognitive metrics for flow, divergence, flexibility, entropy, and ideation velocity
- AI-assisted prompts and session assessment powered by Gemini
- A progress dashboard with assessment history and coaching feedback
- Stripe subscription access control

## Requirements

- Node.js 24.x
- npm

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Configuration

Create a `.env` file with the integrations you intend to use:

```text
# Optional: enables AI creativity assistance and assessments
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash

# Required to enable Stripe subscription checkout
STRIPE_SECRET_KEY=sk_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://your-vercel-domain.vercel.app
BILLING_COOKIE_SECRET=use-a-long-random-secret

# Required for persistent accounts and subscription entitlements
DATABASE_URL=postgresql://...
```

Convergence Form Extractor stores account identity, profile fields, and entitlement state in PostgreSQL; use a managed Postgres provider in production. Stripe is the access source of truth: the subscribe action creates a Stripe Checkout Session for the configured monthly price, so no card details touch this application. Configure `STRIPE_PRICE_ID` as a recurring monthly price for the studio subscription.

## Billing operations

Users create an email/password account before being sent to Stripe Checkout. A completed checkout grants studio access to the authenticated account, and users can sign in on another device to restore paid access after the Stripe webhook has been processed. Passwords are salted and hashed using Node's `scrypt`; session cookies are signed, HttpOnly convenience credentials and are never the entitlement source of truth.

Configure a webhook endpoint at `https://your-domain.example/api/billing/webhook` using `STRIPE_WEBHOOK_SECRET`. Subscribe it to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

The webhook is signature-verified and idempotent. It updates the persistent account entitlement, and premium API access is denied unless that record is currently `active` or `trialing`. Enable the Stripe Customer Portal in the Stripe Dashboard so the in-app **Manage billing** action can open it.

## Production and Vercel

The repository includes a Vercel-ready configuration:

- The Vite client build is published from `dist`.
- The Express API is served through `api/index.ts`. Nested `/api/**` paths are rewritten to that function (Vercel catch-all files only match one segment on Vite projects).
- The deployment uses Node.js 24.

In the Vercel project settings, configure these environment variables:

```text
GEMINI_API_KEY
GEMINI_MODEL
STRIPE_SECRET_KEY
STRIPE_PRICE_ID
STRIPE_WEBHOOK_SECRET
APP_URL=https://your-vercel-domain.example
BILLING_COOKIE_SECRET
DATABASE_URL
```

`DATABASE_URL` should be a pooled PostgreSQL connection string from a managed provider such as Neon, Supabase, or Vercel Postgres. If `DATABASE_URL` is missing or empty, the server uses the first non-empty of `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, and `POSTGRES_URL_NON_POOLING` (the names written by the Vercel Supabase integration). In Vercel, add variables under **Settings > Environment Variables**, select **Production** (and **Preview** if needed), then redeploy. Environment variables added after a deployment do not apply to an existing deployment. Set `APP_URL` to the exact production URL used by the deployed application so Stripe Checkout and the Customer Portal can return users correctly. Do not commit `.env` files or Stripe secrets.

For the standalone server, copy `.env.example` to `.env` before running `npm run dev` or `npm start`. The server loads that file automatically on Node 24. Account registration and login require a resolved database URL and `BILLING_COOKIE_SECRET`; `/api/health` exposes `databaseConfigured`, `geminiConfigured`, and boolean `envPresent` flags (never secret values) so deployment configuration can be checked without exposing secrets.

## Validation

```bash
npm run lint
npm test
npm run build
```

- `npm run lint` type-checks the project.
- `npm test` runs the automated test suite.
- `npm run build` creates the production Vite bundle and server artifact.

## Notes

Convergence Form Extractor stores session history in the running server process. For durable, multi-user production history, connect the creativity session and assessment services to a persistent datastore.
