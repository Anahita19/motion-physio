## Follow-up request — live booking and expanded care map

- [x] “Integrate a real-time calendar booking system into the appointment request form.” Public availability comes only from specific appointment times explicitly published by the clinic in Motion Physio’s internal calendar; availability refreshes every 15 seconds, reservations re-check the selected slot atomically, and no clinic hours or external calendar service are assumed.
- [x] “Add more interactive body parts and customize the treatment plans for each region.” The interactive, non-diagnostic map includes 12 selectable body regions with region-specific activity focus and care overviews.

## Internal calendar management — requested by clinic

- [x] Add a selectable Motion Physio internal calendar to the appointment form; it must require no external calendar service. Keep a general appointment request available if no suitable internal-calendar slot is offered.
- [x] Implement a protected staff calendar to create and edit open slots with explicit local date/time, IANA time zone, therapist, and visit length; display incoming reservations to authorized staff and reject overlapping open times for the same therapist.
- [x] Show current available slots to visitors and reserve a selected slot atomically so concurrent requests cannot double-book it. If staff edits the slot after it was displayed, reject a stale reservation instead of silently booking the changed time.
- [x] Keep internal-calendar reservations pending staff confirmation by default. Authorized staff can confirm or cancel them; cancellation releases the slot back to availability.
- [ ] Configure at least one authorized calendar administrator identity before staff can manage appointments. `OWNER_OPEN_ID` is unset and the protected `MOTION_CALENDAR_ADMIN_EMAIL` input request was cancelled; do not assume the current user is authorized until a role/admin identity is configured.
