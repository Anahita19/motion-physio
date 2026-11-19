import { describe, expect, it } from "vitest";
import { createBookingInput } from "./booking";

const validRequest = {
  name: "Taylor Sample",
  email: "taylor@example.com",
  service: "Sports injury",
  therapist: "Any therapist",
  date: "2028-02-29",
  time: "09:30",
};

describe("booking.create input validation", () => {
  it("accepts the supported fields and optional phone", () => {
    expect(createBookingInput.parse({ ...validRequest, phone: "+1 555 0100" })).toEqual({
      ...validRequest,
      phone: "+1 555 0100",
    });
  });

  it("accepts every supported service and therapist value", () => {
    for (const service of ["Sports injury", "Post-surgery rehab", "Not sure yet"]) {
      expect(createBookingInput.safeParse({ ...validRequest, service }).success).toBe(true);
    }
    for (const therapist of ["Any therapist", "Therapist 1", "Therapist 2", "Therapist 3"]) {
      expect(createBookingInput.safeParse({ ...validRequest, therapist }).success).toBe(true);
    }
  });

  it.each([
    { date: "2027-02-29" },
    { date: "2028-13-01" },
    { date: "2028-02-30" },
    { date: "02/29/2028" },
    { time: "24:00" },
    { time: "09:60" },
    { time: "9:30 AM" },
    { service: "Massage" },
    { therapist: "Unlisted therapist" },
    { email: "not-an-email" },
    { extra: "unexpected" },
  ])("rejects invalid values: %o", (override) => {
    expect(createBookingInput.safeParse({ ...validRequest, ...override }).success).toBe(false);
  });
});
