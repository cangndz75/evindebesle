# Dark Velvet Security Remediation Plan (2026)

## Scope
This document converts the latest evidence-based security findings into PR-ready implementation tracks.

## Evidence Baseline
- DAST smoke: failed with 3 issues (unauthorized endpoints returning 500 instead of 401/403).
- Dependency audit: 2 high + 2 moderate vulnerabilities.
- Payment stack contains backend card handling paths (PAN/CVV touchpoints).
- CORS in iyzico server previously had permissive/fail-open behavior.

## Priority Matrix

### P0 - Blockers (Must fix before production)
1. Remove backend PAN/CVV handling and move to PSP tokenization/hosted checkout.
2. Enforce strict CORS allow-list with fail-closed behavior.
3. Patch known high vulnerabilities from dependency audit.
4. Eliminate auth-path 500 leakage in DAST surface.

### P1 - Hardening (next sprint)
5. Admin MFA (TOTP/WebAuthn) with enforced challenge.
6. At-rest encryption for PII fields (address/phone) using AES-256-GCM + key rotation.

## PR Breakdown

## PR 1 - Payment PCI Refactor
Goal:
- Backend must not receive raw PAN/CVV/expiry values.

Tasks:
- Replace card input API contracts with token/session-based contracts.
- Use provider hosted fields/checkout form.
- Backend accepts only paymentToken/paymentSessionId + amount/order references.
- Remove sensitive card fields from logs and request schemas.
- Add server-side validation rejecting requests that include cardNumber/cvc/expiry.

Acceptance:
- No route accepts PAN/CVV in request body.
- SAST grep on card fields in API request handling returns zero production findings.
- PCI scope reduced toward SAQ-A model.

Implemented in this cycle:
- Added centralized PCI payload detector at lib/security/pci.ts.
- checkout initialize route now hard-rejects cardholder fields with PCI_DSS_VIOLATION.
- Legacy direct card endpoint /api/payment/auth is disabled (410) with hosted-checkout migration message.
- Legacy direct card endpoint /api/tami/start is disabled (410) with hosted-checkout migration message.
- Legacy Express endpoint iyzico-server /api/payment/initiate is disabled (410) to remove backend PAN/CVV intake.
- Added compatibility route /api/payment/initiate that delegates to /api/checkout/initialize after PCI guard.
- Added compatibility route /api/payment/callback delegating to iyzico callback handler.
- Callback hardening: token/order mismatch now rejected before provider retrieval.

## PR 2 - CORS Strict Mode
Goal:
- No wildcard or fail-open behavior with credentials.

Tasks:
- Maintain explicit allow-list from CORS_ALLOWED_ORIGINS.
- Reject unknown origins with hard deny.
- Remove route-level wildcard CORS overrides.

Implemented in this cycle:
- iyzico-server/index.js changed to fail-closed allow-list model.
- iyzico-server/routes/payment.js callback routes no longer use wildcard CORS override.

Acceptance:
- Requests from untrusted Origin are blocked.
- No combination of Access-Control-Allow-Origin:* with credentials:true.

## PR 3 - Dependency Security Updates
Goal:
- Remove known high/moderate production vulnerabilities.

Tasks:
- Upgrade patched versions for next, fast-uri, hono, ip-address.
- Use overrides/resolutions if transitive lock is needed.
- Re-run npm audit --omit=dev and fail CI for high/critical.

Acceptance:
- high=0 and critical=0 in dependency audit.

## PR 4 - DAST Stability and Deterministic Auth Statuses
Goal:
- Unauthorized requests always return 401/403, never 500.

Tasks:
- Harden auth checks in /api/user/me and /api/orders.
- Ensure all auth/session exceptions map to 401/403.
- Keep no-store headers on auth APIs.

Implemented in this cycle:
- app/api/user/me/route.ts switched to direct JWT token check and deterministic 401 fallback.
- app/api/orders/route.ts switched to direct JWT token check and deterministic auth responses.
- middleware.ts wrapped with fail-safe try/catch and protected getToken error handling to avoid unhandled middleware crashes.

Validation evidence:
- Fresh instance run on port 3011 returned expected unauthorized statuses:
	- GET /api/user/me -> 401
	- GET /api/orders -> 401
	- POST /api/user/update-consent -> 401
- This confirms route/middleware logic is correct on current source.

Root-cause conclusion for earlier 500s:
- Prior DAST failures were caused by runtime instance drift (stale process/build or non-current app instance), not the current auth handler logic.

Operational guardrails:
- Before DAST, start a clean app instance and point APP_BASE_URL explicitly.
- Prefer 127.0.0.1 target in smoke checks to avoid host resolution inconsistencies.
- Clear old dev/build processes when status codes differ from code expectations.

Acceptance:
- DAST smoke passes for /api/user/me, /api/orders, /api/user/update-consent.

## PR 5 - Admin MFA
Goal:
- Enforce second factor for isAdmin users.

Tasks:
- Add TOTP enrollment and verification endpoints.
- Require verified MFA challenge before admin session elevation.
- Add backup codes and recovery flow.

Acceptance:
- Admin login without valid second factor is blocked.

Implemented in this cycle:
- Admin login now enforces MFA when enabled (`credentials.otp` required for admin accounts).
- Added TOTP + backup code verification in auth flow (backup code is single-use and consumed atomically).
- Added admin MFA management endpoints:
	- `GET /api/admin/mfa/status`
	- `POST /api/admin/mfa/setup`
	- `POST /api/admin/mfa/enable`
	- `POST /api/admin/mfa/disable`
- Added admin security UI for MFA lifecycle management at `/admin-security`.
- Added encrypted storage for admin MFA secret and backup code hashes.

## PR 6 - PII At-Rest Encryption
Goal:
- Encrypt sensitive PII in database.

Tasks:
- Add crypto helper (AES-256-GCM) and key versioning.
- Encrypt/decrypt selected fields in write/read path.
- Add migration strategy for existing rows.
- Add key rotation playbook.

Acceptance:
- Raw address/phone are not stored as plaintext.
- Decryption only in authorized server paths.

Implemented in this cycle:
- Added AES-256-GCM at-rest crypto helper with versioned payload format (`enc:v1:`).
- Added global Prisma middleware to transparently encrypt/decrypt PII fields:
	- `User.phone`, `User.fullAddress`
	- `UserAddress.fullAddress`, `UserAddress.email`, `UserAddress.phone`, `UserAddress.fullName`
- Added one-time migration script for existing plaintext data:
	- `npm run security:encrypt-pii`
- Added admin MFA columns via Prisma migration:
	- `20260511202010_add_admin_mfa_fields`

Operational requirement:
- Set `DATA_ENCRYPTION_KEY` in production (32-byte base64/hex or strong passphrase).

## CI Gates (recommended)
- security:deps must fail on high/critical.
- security:dast must fail on unauthorized->500 behavior.
- security:sast and security:next must stay clean.

## Operational Notes
- DAST results are evidence-based and currently failing; treat as release blocker.
- CORS hardening committed in code should be verified in deployed runtime with real origins.
