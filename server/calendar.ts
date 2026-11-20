import { and, eq, gte, lte, ne, or } from "drizzle-orm";
import { z } from "zod";
import { appointmentRequests, calendarSlots } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const calendarTherapists = ["Therapist 1", "Therapist 2", "Therapist 3"] as const;
const services = ["Sports injury", "Post-surgery rehab", "Not sure yet"] as const;

export function isRealCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export function isValidTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function isValidTimezone(value: string): boolean {
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
}
export function overlaps(startA: number, durationA: number, startB: number, durationB: number): boolean {
  return startA < startB + durationB && startB < startA + durationA;
}
export function zonedSlotInstant(date: string, time: string, timezone: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const format = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  let candidate = target;
  for (let attempt = 0; attempt < 6; attempt++) {
    const parts = Object.fromEntries(format.formatToParts(new Date(candidate)).map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const correction = target - represented;
    if (correction === 0) return candidate;
    candidate += correction;
  }
  throw new RangeError("This local time does not exist in the selected time zone.");
}
function adjacentDate(date: string, offset: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
}
const dateInput = z.string().refine(isRealCalendarDate, "Enter a real date in YYYY-MM-DD format.");
const timeInput = z.string().refine(isValidTime, "Enter a valid local time in HH:MM format.");
const slotDetailsShape = {
  date: dateInput,
  startTime: timeInput,
  timezone: z.string().min(1).max(64).refine(isValidTimezone, "Enter a valid IANA timezone."),
  therapist: z.enum(calendarTherapists),
  durationMinutes: z.number().int().min(15).max(240).multipleOf(15),
};
function refineLocalSlot(value: { date: string; startTime: string; timezone: string }, context: z.RefinementCtx) {
  try { zonedSlotInstant(value.date, value.startTime, value.timezone); }
  catch { context.addIssue({ code: "custom", path: ["startTime"], message: "This local time does not exist in the selected time zone." }); }
}
export const addCalendarSlotInput = z.object(slotDetailsShape).strict().superRefine(refineLocalSlot);
const slotIdInput = z.object({ slotId: z.number().int().positive() }).strict();
export const updateCalendarSlotInput = z.object({ slotId: z.number().int().positive(), ...slotDetailsShape }).strict().superRefine(refineLocalSlot);

const calendarAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const allowedEmail = ENV.calendarAdminEmail.trim().toLowerCase();
  const userEmail = ctx.user.email?.trim().toLowerCase() ?? "";
  if (ctx.user.role !== "admin" && (!allowedEmail || !userEmail || userEmail !== allowedEmail)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Calendar staff access is not configured for this account." });
  }
  return next({ ctx });
});

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
  return db;
}

export const calendarRouter = router({
  availability: publicProcedure.input(z.object({ from: dateInput.optional(), through: dateInput.optional() }).default({})).query(async ({ input }) => {
    const db = await requireDb();
    const filters = [eq(calendarSlots.status, "available")];
    if (input.from) filters.push(gte(calendarSlots.date, input.from));
    if (input.through) filters.push(lte(calendarSlots.date, input.through));
    return db.select({ id: calendarSlots.id, date: calendarSlots.date, startTime: calendarSlots.startTime, timezone: calendarSlots.timezone, therapist: calendarSlots.therapist, durationMinutes: calendarSlots.durationMinutes })
      .from(calendarSlots).where(and(...filters)).orderBy(calendarSlots.date, calendarSlots.startTime);
  }),
  reserve: publicProcedure.input(z.object({
    slotId: z.number().int().positive(), name: z.string().trim().min(1).max(200), email: z.string().trim().email().max(320),
    phone: z.string().trim().max(40).optional(), service: z.enum(services), expected: addCalendarSlotInput,
  }).strict()).mutation(async ({ input }) => {
    const db = await requireDb();
    try {
      const result = await db.transaction(async tx => {
        const rows = await tx.select().from(calendarSlots).where(eq(calendarSlots.id, input.slotId)).for("update");
        const slot = rows[0];
        if (!slot || slot.status !== "available" || slot.date !== input.expected.date || slot.startTime !== input.expected.startTime || slot.timezone !== input.expected.timezone || slot.therapist !== input.expected.therapist || slot.durationMinutes !== input.expected.durationMinutes) {
          throw new TRPCError({ code: "CONFLICT", message: "This appointment time changed or is no longer available." });
        }
        await tx.update(calendarSlots).set({ status: "reserved" }).where(and(eq(calendarSlots.id, slot.id), eq(calendarSlots.status, "available")));
        const inserted = await tx.insert(appointmentRequests).values({ name: input.name, email: input.email, phone: input.phone || null, service: input.service, therapist: slot.therapist, date: slot.date, time: slot.startTime, slotId: slot.id, status: "pending" });
        return { requestId: Number(inserted[0].insertId), slot };
      });
      return { success: true as const, requestId: result.requestId, message: "Your request was received and is pending clinic confirmation." };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw error;
    }
  }),
  staff: router({
    list: calendarAdminProcedure.query(async () => {
      const db = await requireDb();
      return db.select({ slot: calendarSlots, appointment: appointmentRequests }).from(calendarSlots)
        .leftJoin(appointmentRequests, and(eq(appointmentRequests.slotId, calendarSlots.id), ne(appointmentRequests.status, "cancelled")))
        .orderBy(calendarSlots.date, calendarSlots.startTime);
    }),
    addSlot: calendarAdminProcedure.input(addCalendarSlotInput).mutation(async ({ input }) => {
      const db = await requireDb();
      await db.transaction(async tx => {
        const candidates = await tx.select({ date: calendarSlots.date, startTime: calendarSlots.startTime, timezone: calendarSlots.timezone, durationMinutes: calendarSlots.durationMinutes })
          .from(calendarSlots).where(and(gte(calendarSlots.date, adjacentDate(input.date, -1)), lte(calendarSlots.date, adjacentDate(input.date, 1)), eq(calendarSlots.therapist, input.therapist), ne(calendarSlots.status, "cancelled"))).for("update");
        const proposedStart = zonedSlotInstant(input.date, input.startTime, input.timezone);
        if (candidates.some(existing => overlaps(proposedStart, input.durationMinutes * 60_000, zonedSlotInstant(existing.date, existing.startTime, existing.timezone), existing.durationMinutes * 60_000))) {
          throw new TRPCError({ code: "CONFLICT", message: "This slot overlaps another slot for the selected therapist." });
        }
        await tx.insert(calendarSlots).values({ ...input, status: "available" });
      });
      return { success: true as const };
    }),
    updateSlot: calendarAdminProcedure.input(updateCalendarSlotInput).mutation(async ({ input }) => {
      const db = await requireDb();
      const { slotId, ...updated } = input;
      await db.transaction(async tx => {
        const currentRows = await tx.select().from(calendarSlots).where(eq(calendarSlots.id, slotId)).for("update");
        const current = currentRows[0];
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Calendar slot not found." });
        if (current.status !== "available") throw new TRPCError({ code: "CONFLICT", message: "Only an open slot can be edited." });
        const candidates = await tx.select({ date: calendarSlots.date, startTime: calendarSlots.startTime, timezone: calendarSlots.timezone, durationMinutes: calendarSlots.durationMinutes })
          .from(calendarSlots).where(and(gte(calendarSlots.date, adjacentDate(updated.date, -1)), lte(calendarSlots.date, adjacentDate(updated.date, 1)), eq(calendarSlots.therapist, updated.therapist), ne(calendarSlots.status, "cancelled"), ne(calendarSlots.id, slotId))).for("update");
        const proposedStart = zonedSlotInstant(updated.date, updated.startTime, updated.timezone);
        if (candidates.some(existing => overlaps(proposedStart, updated.durationMinutes * 60_000, zonedSlotInstant(existing.date, existing.startTime, existing.timezone), existing.durationMinutes * 60_000))) {
          throw new TRPCError({ code: "CONFLICT", message: "This slot overlaps another slot for the selected therapist." });
        }
        await tx.update(calendarSlots).set(updated).where(and(eq(calendarSlots.id, slotId), eq(calendarSlots.status, "available")));
      });
      return { success: true as const };
    }),
    confirm: calendarAdminProcedure.input(slotIdInput).mutation(async ({ input }) => {
      const db = await requireDb();
      return db.transaction(async tx => {
        const rows = await tx.select().from(calendarSlots).where(eq(calendarSlots.id, input.slotId)).for("update");
        const slot = rows[0];
        if (!slot || slot.status !== "reserved") throw new TRPCError({ code: "CONFLICT", message: "Only a reserved appointment can be confirmed." });
        const requests = await tx.select().from(appointmentRequests).where(and(eq(appointmentRequests.slotId, slot.id), eq(appointmentRequests.status, "pending"))).for("update");
        if (!requests[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Pending appointment request not found." });
        await tx.update(appointmentRequests).set({ status: "confirmed" }).where(eq(appointmentRequests.id, requests[0].id));
        await tx.update(calendarSlots).set({ status: "confirmed" }).where(eq(calendarSlots.id, slot.id));
        return { success: true as const };
      });
    }),
    cancel: calendarAdminProcedure.input(slotIdInput).mutation(async ({ input }) => {
      const db = await requireDb();
      return db.transaction(async tx => {
        const rows = await tx.select().from(calendarSlots).where(eq(calendarSlots.id, input.slotId)).for("update");
        const slot = rows[0];
        if (!slot || !["reserved", "confirmed"].includes(slot.status)) throw new TRPCError({ code: "CONFLICT", message: "Only a reserved or confirmed appointment can be cancelled." });
        await tx.update(appointmentRequests).set({ status: "cancelled" }).where(and(eq(appointmentRequests.slotId, slot.id), or(eq(appointmentRequests.status, "pending"), eq(appointmentRequests.status, "confirmed"))));
        await tx.update(calendarSlots).set({ status: "available" }).where(eq(calendarSlots.id, slot.id));
        return { success: true as const };
      });
    }),
  }),
});
