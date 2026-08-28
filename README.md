# Dyuthi — CBIT National Performing Arts Festival

Official website for **Dyuthi**, Chaitanya Bharathi Institute of Technology's national-level performing arts festival, organized by Chaitanya Geethi, Vaadya, UDC (United Dance Crew), and Laasya.

Live site: [dyuthi-fest.vercel.app](https://dyuthi-fest.vercel.app)

## What's in here

- **Event pages** — details, rules, and registration for each flagship competition:
  - **Aangikam** (Classical Dance) — Laasya
  - **3T's** (Hip-Hop Crew) — United Dance Crew
  - **Veni, Vidi, Vici.** (Battle of the Bands) — Chaitanya Geethi x Vaadya
- **Audience registration** — separate flow for non-competing attendees (free entry for CBIT students)
- **Two-step Battle of the Bands flow** — Round 1 entry, and a Round 2 form gated behind selection status
- **Payment tracking** — manual UPI QR + screenshot upload, with payee name/phone/UTR fields for reconciliation
- **Flash sale support** — time-boxed discount banners with a live countdown, configurable per event
- **Admin dashboard** — club-specific logins to view registrations for that club's event, plus a main-admin login with a table selector to view any event's data
- **Confirmation emails** — sent via Resend on successful registration, including a workshop discount coupon code (competition registrants only)
- **OCR verification pipeline** — background ID/payment verification via Supabase webhooks (currently disabled pending a webhook connectivity issue — see Known Issues)

## Tech stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **Supabase** — Postgres database, Row Level Security, Storage (ID proofs, payment screenshots)
- **Resend** — transactional email
- **Vercel** — hosting/deployment
- **Playwright** — end-to-end tests for every registration flow

## Getting started

```bash
npm install
npm run dev
```

### Environment variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

## Testing

```bash
npm run dev          # in one terminal
npx playwright test --headed   # in another
```

Tests submit real registrations against the live Supabase project. After running, clean up test data:

```bash
# run cleanup-test-data.sql in the Supabase SQL editor
```

CI runs the same suite manually via GitHub Actions (`workflow_dispatch` only, not on every push, to avoid polluting production data automatically).

## Key config

- `app/lib/config.ts` — feature flags: `PAYMENT_REQUIRED`, `FLASH_SALE`, `TEAM_NOTIFICATION_EMAIL`
- `app/lib/clubAuth.ts` — admin login credentials per club (env-based passwords)

## Known issues

- **OCR verification webhook**: Supabase's `pg_net` extension times out at the DNS resolution stage when calling `/api/verify-registration`. This appears to be an intermittent infrastructure issue between Supabase and Vercel's edge network, not an application bug. OCR-related fields are hidden from the admin dashboard until this is resolved (flag: check `app/admin/page.tsx`).
- **Automated confirmation emails** currently go to the team's own inbox for manual forwarding, since a custom domain hasn't been verified with Resend yet. Once verified, update `FROM_ADDRESS` in `app/api/send-confirmation/route.ts` and the `toEmail` fields in each registration form.

## Admin access

`/admin/login` — select a club and enter its password. The main admin account can view all events; individual club logins see only their own event's registrations.
