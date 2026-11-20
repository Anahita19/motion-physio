import { describe, expect, it } from "vitest";
import { addCalendarSlotInput, isRealCalendarDate, isValidTime, isValidTimezone, overlaps, updateCalendarSlotInput, zonedSlotInstant } from "./calendar";

const slot = { date: "2028-02-29", startTime: "09:30", timezone: "America/Toronto", therapist: "Therapist 1", durationMinutes: 60 };

describe("calendar slot validation", () => {
  it("accepts a valid explicit slot", () => {
    expect(addCalendarSlotInput.parse(slot)).toEqual(slot);
  });
  it("accepts an explicit edit for a calendar slot", () => {
    expect(updateCalendarSlotInput.parse({ slotId: 7, ...slot })).toEqual({ slotId: 7, ...slot });
  });
  it("rejects local times skipped by a daylight-saving transition", () => {
    expect(addCalendarSlotInput.safeParse({ ...slot, date: "2027-03-14", startTime: "02:30", timezone: "America/New_York" }).success).toBe(false);
  });
  it.each([
    { date: "2027-02-29" }, { date: "2028-02-30" }, { date: "02/29/2028" },
    { startTime: "24:00" }, { startTime: "9:30" }, { timezone: "Mars/Olympus" },
    { therapist: "Any therapist" }, { durationMinutes: 10 }, { durationMinutes: 55 }, { durationMinutes: 300 },
  ])("rejects invalid slot values: %o", override => {
    expect(addCalendarSlotInput.safeParse({ ...slot, ...override }).success).toBe(false);
  });
  it("validates real dates, 24-hour local times and IANA zones", () => {
    expect(isRealCalendarDate("2028-02-29")).toBe(true);
    expect(isRealCalendarDate("2027-02-29")).toBe(false);
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTimezone("Asia/Tehran")).toBe(true);
    expect(isValidTimezone("Invalid/Zone")).toBe(false);
  });
  it("detects intersecting time intervals but permits adjacent slots", () => {
    expect(overlaps(540, 60, 570, 30)).toBe(true);
    expect(overlaps(540, 60, 600, 30)).toBe(false);
    expect(overlaps(600, 45, 540, 60)).toBe(false);
  });
  it("resolves explicit local times to comparable instants across time zones", () => {
    const eastern = zonedSlotInstant("2028-01-01", "09:00", "America/New_York");
    const utc = zonedSlotInstant("2028-01-01", "14:00", "UTC");
    expect(eastern).toBe(utc);
    expect(overlaps(eastern, 60 * 60_000, utc + 30 * 60_000, 30 * 60_000)).toBe(true);
  });
});
