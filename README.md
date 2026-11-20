# Motion Physio

**A full-stack physical therapy clinic website and appointment-scheduling demo.** Motion Physio pairs a calm, responsive visitor experience with a clinic-managed calendar built to handle real availability, time zones, and pending appointment requests.

[![Open the public repository](https://img.shields.io/badge/GitHub-public%20portfolio%20repo-181717?logo=github)](https://github.com/Anahita19/motion-physio)

> **Demo status:** This repository includes the application source, a local run guide, and static screenshots. The website itself is not currently hosted as a live demo. The screenshots are visual previews; use the local setup below to explore the interactive site.

## Product overview

The site is designed for a physical therapy clinic focused on sports injuries and post-surgery rehabilitation. Its public experience helps visitors explore care information and request an appointment, while a protected staff calendar manages clinic-published availability.

### Screenshots

![Full-page desktop preview of the Motion Physio homepage](docs/assets/demo-desktop.png)

<details>
<summary>View the mobile preview</summary>

![Full-page mobile preview of the Motion Physio homepage](docs/assets/demo-mobile.png)

</details>

### Visitor experience

- Responsive landing page with a clear **$120 first-visit price**.
- Interactive map of **12 body regions**; selecting a region updates the accompanying general care information.
- Three therapist profile cards, currently labeled as placeholders.
- Pricing and insurance information that avoids claiming unverified coverage.
- Recovery-story section marked as coming soon rather than using fabricated testimonials.
- Scripted FAQ assistant for common questions; it is informational only, not medical advice or emergency support.
- Appointment dialog for selecting an open time from the internal calendar or requesting a different time.

### Staff experience

- Protected calendar at `/staff/calendar` for managing appointment availability and requests.
- Staff can publish, edit, confirm, or cancel appointments, subject to each item's current status.
- Visitors can see only published availability; a reservation remains **pending** until staff confirms it.

## Engineering highlights

- **Race-safe reservations:** slot state is rechecked and reserved in a database transaction, so simultaneous requests cannot silently book the same open slot.
- **Time-zone-aware scheduling:** each slot carries an IANA time-zone identifier and duration; server-side overlap checks compare actual instants rather than assuming one clinic-wide time zone.
- **Clear booking states:** open availability, reserved slots, pending requests, confirmations, and cancellations are distinct states.
- **Server-side validation:** API inputs are validated before database operations, with conflict responses for stale or overlapping availability.
- **Protected staff operations:** calendar management requires an authenticated admin or an account matching the configured staff email.
- **Separation of concerns:** React UI, tRPC API procedures, Drizzle data access, and SQL migrations are organized into their respective client, server, and database layers.

## Technology

| Area | Tools |
| --- | --- |
| Front end | React 19, TypeScript, Vite, Tailwind CSS |
| Server/API | Node.js, Express, tRPC |
| Data | MySQL, Drizzle ORM, checked-in SQL migrations |
| Validation | Zod |
| Testing | Vitest |
| Package manager | pnpm 10.18.0 |

## Run locally

### Requirements

- Node.js 22 recommended
- pnpm 10.18.0 (the project pins this version in `package.json`)
- MySQL for database-backed booking and calendar features
- Valid authentication-provider settings for sign-in and staff calendar access

### 1. Clone and install

```bash
git clone https://github.com/Anahita19/motion-physio.git
cd motion-physio
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
```

### 2. Configure your local environment

Create a local environment file from the safe template:

```bash
cp .env.example .env
```

Use a **dedicated development database** and edit `.env` with your own values. For a locally running MySQL instance, `DATABASE_URL` follows the form below (create the database and user first, and URL-encode special characters in credentials):

```dotenv
DATABASE_URL=mysql://<username>:<password>@127.0.0.1:3306/<database>
```

The template lists all supported variables. The following are used for the corresponding capabilities:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection for availability, reservations, appointment requests, and migrations. |
| `MANUS_PROJECT_ID` | Application identifier used by the configured Manus OAuth integration. |
| `MANUS_OAUTH_API_URL` | OAuth service endpoint used during sign-in. |
| `MANUS_JWT_SECRET` | Server-side signing secret for application sessions. |
| `MOTION_CALENDAR_ADMIN_EMAIL` | Optional staff email allowed to manage the calendar; the account must also sign in. An authenticated admin role is an alternative. |
| `MANUS_API_URL`, `MANUS_API_KEY` | Server-side credentials for Manus platform APIs used by platform-backed features. Keep these private. |

OAuth and API values must come from an environment you control and are authorized to use; this repository does not include credentials. Never commit `.env` or real keys. `.env.example` contains blank placeholders only.

> **UI-only exploration:** The public homepage can be explored without seeding calendar data. Database-backed availability and booking require a reachable MySQL database. Sign-in and staff-calendar operations additionally require valid OAuth configuration and staff authorization.

### 3. Apply database migrations

Start MySQL and ensure `DATABASE_URL` points to your **development** database, then run:

```bash
pnpm db:migrate
```

This applies the checked-in schema migrations to the selected database. Do not point local development or tests at production or shared clinic data. No appointment slots are seeded automatically.

### 4. Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The Express server hosts the Vite development experience and API. With a configured database, visitors can see slots published by staff; because no demo slots are seeded, the initial calendar is empty. A visitor may request another time, but this is not a confirmed appointment.

For the staff workflow, configure OAuth and `MOTION_CALENDAR_ADMIN_EMAIL` (or an authenticated admin role), then visit `http://localhost:3000/staff/calendar` and publish test availability in your development database.

## Verification commands

```bash
pnpm check       # TypeScript type-check
pnpm test        # Unit and integration tests
pnpm build       # Build the client and server
pnpm start       # Serve the production build
```

The database commands are:

```bash
pnpm db:migrate  # Apply checked-in SQL migrations
pnpm db:push     # Generate and apply schema changes during development
```

Review generated migration changes before using `pnpm db:push`; do not run schema-changing commands against a production database without an explicit backup and review.

## Architecture at a glance

```text
Visitor / Staff
      │
      ▼
React + TypeScript UI
      │ tRPC
      ▼
Express application server
      │ Drizzle ORM
      ▼
MySQL
```

```text
client/                  React application and shared UI
  src/components/        Body map, booking modal, FAQ assistant
  src/pages/              Home page and staff calendar
server/                  Express/tRPC application logic
  calendar.ts             Availability, reservations, and staff operations
  booking.ts              Appointment request handling
drizzle/                  Database schema and SQL migrations
docs/                     Demo walkthrough and calendar guide
```

## Scope and responsible-use notes

This is a **portfolio/demo project**, not a clinic-ready deployment. No real therapist names or credentials, clinic address/hours, insurance participation, follow-up prices, or patient recovery testimonials have been provided. Verify those facts before replacing placeholders or making public clinic claims.

The body-map copy is general information, not diagnosis or medical advice. The FAQ assistant is scripted and does not assess emergencies. The internal calendar has no external calendar sync, clinic-wide hours, default time zone, or seeded open slots; staff defines availability per slot. Do not enter real patient data into a demo environment.

## Further documentation

- [Demo walkthrough](docs/DEMO.md)
- [Internal appointment calendar](docs/CALENDAR.md)
- [Environment variable template](.env.example)
- [Public GitHub repository](https://github.com/Anahita19/motion-physio)
