# Convergence Form Extractor

Convergence Form Extractor is an AI-assisted creativity studio for practicing divergent thinking, monitoring creative momentum, and reviewing assessed sessions over time. It combines guided creativity exercises, a diagnostic assessment, an AI Muse playground, cognitive telemetry, and a verification ledger.

## Features

- A catalog of guided creativity exercises and custom prompts
- A diagnostic creativity assessment
- Live cognitive metrics for flow, divergence, flexibility, entropy, and ideation velocity
- AI-assisted prompts and session assessment powered by Gemini
- A progress dashboard with assessment history and coaching feedback
- Google Play Store digital app distribution and account authentication

## Requirements

- Node.js 20.19 or later
- npm

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Configuration

Create a `.env` file with the integrations you intend to use:

```text
# Optional: enables AI creativity assistance and assessments
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.8-flash

# Google Play Store Distribution
GOOGLE_PLAY_PACKAGE_NAME=com.axiomzetainnovations.convergenceform
APP_URL=http://localhost:3000
BILLING_COOKIE_SECRET=use-a-long-random-secret

# Required for persistent accounts and verification ledger
DATABASE_URL=postgresql://...
```

## Google Play Store & Account Operations

Convergence Form Extractor is packaged and distributed through the Google Play Store (via Trusted Web Activity / TWA). Account authentication uses email and salted/hashed credentials via Node `scrypt`. Digital orders and licenses purchased through Google Play can be linked to member accounts via the `/api/billing/play-store-verify` endpoint.

## Production and Vercel

The repository includes a Vercel-ready configuration:

- The Vite client build is published from `dist`.
- The Express API is served through `api/[...path].ts`.
- The deployment uses Node.js 20.

In the Vercel project settings, configure these environment variables:

```text
GEMINI_API_KEY
GEMINI_MODEL
GOOGLE_PLAY_PACKAGE_NAME=com.axiomzetainnovations.convergenceform
APP_URL=https://your-vercel-domain.example
BILLING_COOKIE_SECRET
DATABASE_URL
```

Set `APP_URL` to the exact production URL used by the deployed application.

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
