import { z } from "zod";
import { appointmentRequests } from "../drizzle/schema";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, router } from "./_core/trpc";

const services = ["Sports injury", "Post-surgery rehab", "Not sure yet"] as const;
const therapists = [
  "Any therapist",
  "Therapist 1",
  "Therapist 2",
  "Therapist 3",
] as const;

function isRealCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const createBookingInput = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().max(40).optional(),
    service: z.enum(services),
    therapist: z.enum(therapists),
    date: z.string().refine(isRealCalendarDate, "Enter a valid date (YYYY-MM-DD)."),
    time: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time (HH:MM)."),
  })
  .strict();

export const bookingRouter = router({
  create: publicProcedure.input(createBookingInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database is not available");

    await db.insert(appointmentRequests).values({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      service: input.service,
      therapist: input.therapist,
      date: input.date,
      time: input.time,
    });

    const notificationContent = [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      ...(input.phone ? [`Phone: ${input.phone}`] : []),
      `Service: ${input.service}`,
      `Therapist: ${input.therapist}`,
      `Requested date/time: ${input.date} ${input.time}`,
    ].join("\n");

    try {
      const delivered = await notifyOwner({
        title: "New appointment request",
        content: notificationContent,
      });
      if (!delivered) console.warn("[Booking] Owner notification was not accepted.");
    } catch (error) {
      console.warn("[Booking] Owner notification failed after request was stored:", error);
    }

    return {
      success: true as const,
      message: "Your request was received. The clinic will follow up with you.",
    };
  }),
});
