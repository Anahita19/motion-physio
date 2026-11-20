# Internal Appointment Calendar

Motion Physio uses an application-managed calendar. It does not depend on Google Calendar, Outlook, or an external scheduling service.

## Visitor booking flow

- The public availability view reads open slots from the configured MySQL database and refreshes periodically while the booking dialog is open.
- Each slot includes its date, local start time, IANA time-zone identifier, therapist, and duration.
- Visitors can filter by therapist, choose an open time, and submit contact details and a service choice.
- Reservation is performed against the current slot state in a database transaction. If the slot changed or another visitor reserved it first, the request is rejected and availability is refreshed.
- A successful reservation changes the slot to reserved and creates an appointment request with **pending** status. Staff confirmation is a separate action.
- “Request another time” creates an appointment request for a preferred date and time; it does not reserve a slot and is not a confirmed booking.

## Staff workflow

1. Sign in through the application's configured authentication provider.
2. Open `/staff/calendar`.
3. Publish an availability slot by entering its date, start time, valid IANA time zone, therapist, and duration (15–240 minutes in 15-minute increments).
4. Review pending requests. Confirm an appointment when ready, or cancel a reservation/confirmed appointment. Cancelling a reserved slot returns it to availability.
5. Available slots can be edited if they have not already been reserved. The server checks for overlapping slots for the same therapist, accounting for each slot's time zone and duration.

No clinic-wide business hours, default time zone, visit duration, or buffer were supplied. Staff enter the relevant date, time zone, and duration when creating each slot. Confirm the clinic's actual scheduling policy before adding live availability.

## Staff access configuration

The staff route is `/staff/calendar`. Calendar operations require a signed-in account whose role is `admin`, or whose email matches `MOTION_CALENDAR_ADMIN_EMAIL` (case-insensitive). If the variable is absent or does not match the account, staff operations are denied. Configure the value in the deployment's private environment settings; do not commit an email or secret to source control. Authentication itself must also be configured and working.

The current project configuration has not yet supplied a calendar administrator identity. Until an authorized account is configured, staff calendar administration is a setup blocker. Do not treat the route being visible as proof that its protected operations are enabled.

## Current demo data

There are currently no published open slots. The public booking UI therefore explains that no times are available and offers the “Request another time” path. Do not add sample slots to a shared or production database just to make a screenshot; appointment data is shared by all environments using the same database.

## Data handling

The configured database stores calendar slots and appointment requests. Use a dedicated development database for local testing, restrict access to real appointment data, and apply the clinic's applicable privacy and security requirements before accepting real patient information. The public booking form advises visitors not to submit medical history or urgent concerns.
