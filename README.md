# Dark Velvet

Dark Velvet is a Next.js 15 e-commerce application with App Router, Prisma, NextAuth, payment/cargo integrations, and a custom security automation pipeline.

## Stack

- Next.js 15 + React 19 + TypeScript
- Prisma + PostgreSQL
- NextAuth
- Zustand for client state
- Resend/Twilio for notifications
- Upstash Redis for rate-limit/replay/idempotency helpers

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Fill required secrets in `.env`.

4. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

5. Start development server:

```bash
npm run dev
```

## Quality Gate

Run full local quality checks:

```bash
npm run ci:quality
```

`ci:quality` runs:

- `npm run lint`
- `npm run test:unit`
- `npm run typecheck`
- `npm run build:ci`

All quality gate steps are blocking.

## Tests

Run unit tests:

```bash
npm run test:unit
```

Watch mode:

```bash
npm run test:watch
```

## Security Automation

Static security checks:

```bash
npm run security:all
```

Available commands:

- `npm run security:deps`: dependency vulnerabilities (high/critical gate)
- `npm run security:ai`: AI integrity scan
- `npm run security:next`: Next.js data-flow checks
- `npm run security:sast`: SAST + privacy/auth checks
- `npm run security:contracts`: contract checks for sensitive boundaries

Dynamic security smoke:

```bash
# terminal 1
npm run dev

# terminal 2
set APP_BASE_URL=http://localhost:3000 && npm run security:dast
```

## Cargo Webhook Security

Cargo webhook endpoint: `/api/webhooks/cargo-status`

Implemented protections:

- HMAC signature verification (`x-cargo-signature`)
- Timestamp freshness check (`x-cargo-timestamp`)
- Replay protection with Redis-backed nonce fingerprint (fallback: in-memory)
- Optional source IP allowlist gate
- Optional webhook rate-limit gate
- Structured security audit events for denied/accepted requests
- Strict delivery transition guard in order state machine

Relevant environment variables:

- `CARGO_WEBHOOK_SECRET`
- `CARGO_WEBHOOK_MAX_SKEW_SECONDS` (default `300`)
- `CARGO_WEBHOOK_REPLAY_TTL_SECONDS` (default `300`)
- `CARGO_WEBHOOK_IP_ALLOWLIST` (comma-separated, supports `*` and `10.0.0.*`)
- `CARGO_WEBHOOK_RATE_LIMIT_ENABLED` (default `true`)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (recommended)

## Build and Run

Production build:

```bash
npm run build
npm run start
```

## CI

- `.github/workflows/ci.yml` runs quality gate on push/PR.
- `.github/workflows/security.yml` runs security automation.

## Operational Notes

- Keep webhook/API secrets only in server runtime env, never expose to client.
- Rotate payment/cargo secrets regularly.
- Review `security:all` output before releases.
- Run Prisma migrations in controlled rollout windows.
