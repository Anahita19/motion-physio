# Motion Physio Demo Guide

This guide describes the current implementation. The screenshots are static captures of the homepage, not a hosted or click-through demo. For interactive behavior, run the application locally as described in the root [README](../README.md).

## Screenshots

### Desktop

![Full-page Motion Physio homepage at desktop width](assets/demo-desktop.png)

### Mobile

![Full-page Motion Physio homepage at mobile width](assets/demo-mobile.png)

## Visitor walkthrough

1. **Explore the homepage.** The hero presents Motion Physio as a clinic concept focused on sports injuries and post-surgery rehabilitation. Use the main navigation or page links to move through the sections.
2. **Explore the body map.** Go to “Let’s meet you where you are.” Select one of the 12 body regions—neck, shoulder, upper arm, elbow, wrist & hand, upper back, lower back, hip, thigh, knee, lower leg, or ankle & foot. The panel updates with general focus areas and possible plan elements. These are informational examples, not a clinical assessment.
3. **Review the team and pricing.** The page displays three therapist placeholders and the stated **$120 first-visit price**. Individual identities and credentials are not represented as verified facts. Insurance participation and follow-up pricing remain unconfirmed.
4. **Review recovery stories.** The section is marked as “Real stories, coming soon”; no patient testimonials are fabricated.
5. **Try the FAQ assistant.** Open “Have a question?” and try the suggested questions about price, insurance, or appointment requests. Its answers are scripted; it is not a generative AI or a medical service. Urgent concerns should be directed to appropriate medical care.
6. **Open appointment requests.** Use “Request an appointment.” The calendar source is Motion Physio’s internal calendar. At the current demo data state there are no published open slots, so try “Request another time” to inspect the preferred-date/time form. Submitting a preferred time is a request only, not a confirmed booking.

## Staff calendar walkthrough

The staff interface is available at `/staff/calendar`. To use it, the signed-in account must have the `admin` role or its email must exactly match the configured `MOTION_CALENDAR_ADMIN_EMAIL` value (comparison is case-insensitive). A valid authentication setup and database are required. See [Internal appointment calendar](CALENDAR.md) for the staff workflow and safeguards.

The demo does not contain pre-seeded availability. Once an authorized staff member adds an open slot, it appears in the public booking calendar. A visitor can reserve that slot; the reservation remains pending until staff confirms it.

## Run the interactive demo locally

Follow the prerequisites, environment setup, migrations, and `pnpm dev` instructions in the root [README](../README.md). Without a configured MySQL database, public availability and booking mutations cannot be demonstrated. Without working authentication and staff authorization, the protected staff operations are unavailable.

## Demo boundaries

- No live public URL is included; the project has not been deployed by this demo documentation work.
- Screenshots show the homepage and do not exercise the interactive body map, chat, or booking forms.
- The calendar is internal to Motion Physio and has no external calendar sync.
- The calendar time zone and opening hours are entered as part of each staff-created slot; no clinic-wide hours or default time zone are assumed.
- A slot reservation is not a confirmed appointment. The clinic must confirm it in the staff calendar.
- The page is a software demo, not a source of diagnosis or individualized medical advice.
