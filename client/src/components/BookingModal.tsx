import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, Check, Clock3, Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Mode = "calendar" | "request";
const services = ["Sports injury", "Post-surgery rehab", "Not sure yet"] as const;
const therapists = ["Any therapist", "Therapist 1", "Therapist 2", "Therapist 3"] as const;
type Service = (typeof services)[number];
type Therapist = (typeof therapists)[number];
type SlotChoice = { date: string; startTime: string; timezone: string; therapist: Exclude<Therapist, "Any therapist">; durationMinutes: number };
const blank = { name: "", email: "", phone: "", service: "" as Service | "", therapist: "Any therapist" as Therapist, date: "", time: "" };

function localDateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function prettyDate(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

export default function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState(blank);
  const [mode, setMode] = useState<Mode>("calendar");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedSlotSnapshot, setSelectedSlotSnapshot] = useState<SlotChoice | null>(null);
  const [success, setSuccess] = useState(false);
  const [reservedSlot, setReservedSlot] = useState(false);
  const from = localDateOffset(0);
  const through = localDateOffset(60);
  const availability = trpc.calendar.availability.useQuery({ from, through }, { enabled: open, refetchInterval: 15_000, staleTime: 0 });
  const reserve = trpc.calendar.reserve.useMutation({
    onSuccess: () => { setReservedSlot(true); setSuccess(true); },
    onError: error => {
      if (error.data?.code === "CONFLICT") {
        setSelectedSlotId(null);
        setSelectedSlotSnapshot(null);
        void availability.refetch();
      }
    },
  });
  const request = trpc.booking.create.useMutation({ onSuccess: () => { setReservedSlot(false); setSuccess(true); } });

  const dates = useMemo(() => Array.from(new Set((availability.data ?? []).map(slot => slot.date))), [availability.data]);
  useEffect(() => {
    if (dates.length && (!selectedDate || !dates.includes(selectedDate))) setSelectedDate(dates[0]);
  }, [dates, selectedDate]);
  const visibleSlots = useMemo(() => (availability.data ?? []).filter(slot =>
    slot.date === selectedDate && (form.therapist === "Any therapist" || slot.therapist === form.therapist)
  ), [availability.data, selectedDate, form.therapist]);
  useEffect(() => {
    if (!selectedSlotId) return;
    const current = visibleSlots.find(slot => slot.id === selectedSlotId);
    if (!current || !selectedSlotSnapshot || current.date !== selectedSlotSnapshot.date || current.startTime !== selectedSlotSnapshot.startTime || current.timezone !== selectedSlotSnapshot.timezone || current.therapist !== selectedSlotSnapshot.therapist || current.durationMinutes !== selectedSlotSnapshot.durationMinutes) {
      setSelectedSlotId(null);
      setSelectedSlotSnapshot(null);
    }
  }, [selectedSlotId, selectedSlotSnapshot, visibleSlots]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // close is intentionally scoped to this dialog lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function setField<K extends keyof typeof blank>(key: K, value: (typeof blank)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.service) return;
    if (mode === "calendar") {
      const selectedSlot = visibleSlots.find(slot => slot.id === selectedSlotId);
      if (!selectedSlot || !selectedSlotSnapshot) return;
      reserve.mutate({ slotId: selectedSlot.id, expected: selectedSlotSnapshot, name: form.name, email: form.email, phone: form.phone || undefined, service: form.service });
      return;
    }
    if (!form.date || !form.time) return;
    request.mutate({ name: form.name, email: form.email, phone: form.phone || undefined, service: form.service, therapist: form.therapist, date: form.date, time: form.time });
  }
  function close() {
    onClose();
    window.setTimeout(() => {
      setSuccess(false); setReservedSlot(false); setForm(blank); setMode("calendar"); setSelectedSlotId(null); setSelectedSlotSnapshot(null);
      reserve.reset(); request.reset();
    }, 250);
  }
  if (!open) return null;
  const error = reserve.error ?? request.error;
  const isPending = reserve.isPending || request.isPending;

  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="booking-modal booking-modal-calendar" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <button className="modal-close" onClick={close} aria-label="Close appointment request"><X size={20} /></button>
      {success ? <div className="booking-success"><span className="success-icon"><Check size={26} /></span><span className="eyebrow">{reservedSlot ? "TIME RESERVED" : "REQUEST RECEIVED"}</span><h2 id="booking-title">A good first step.</h2><p>{reservedSlot ? "Your selected time has been reserved in Motion Physio’s internal calendar. Your appointment is pending clinic confirmation; the clinic will follow up with you." : "Your request has been received. It is not a confirmed booking; the clinic can follow up about availability and next steps."}</p><button className="button button-dark" onClick={close}>Back to the website <ArrowRight size={17} /></button></div> : <>
        <span className="eyebrow"><span /> LET’S GET MOVING</span><h2 id="booking-title">Request an appointment.</h2><p className="modal-intro">Select an open time in the Motion Physio internal calendar, or ask the clinic about a different time. Your first visit is <strong>$120</strong>.</p>
        <label className="calendar-source"><CalendarDays size={17} /><div><strong>Calendar for this appointment</strong><small>Managed by Motion Physio · no external calendar service</small></div><select aria-label="Select calendar"><option value="motion-internal">Motion Physio internal calendar</option></select><span className="internal-live-dot" /></label>
        <div className="booking-mode" role="tablist" aria-label="Choose appointment request type"><button type="button" role="tab" aria-selected={mode === "calendar"} className={mode === "calendar" ? "active" : ""} onClick={() => setMode("calendar")}>Choose an open time</button><button type="button" role="tab" aria-selected={mode === "request"} className={mode === "request" ? "active" : ""} onClick={() => setMode("request")}>Request another time</button></div>
        <form onSubmit={submit} className="booking-form">
          {mode === "calendar" ? <>
            <div className="form-row"><label>Preferred therapist<select value={form.therapist} onChange={event => setField("therapist", event.target.value as Therapist)}>{therapists.map(therapist => <option key={therapist}>{therapist}</option>)}</select></label><label>Available date<select value={selectedDate} required onChange={event => { setSelectedDate(event.target.value); setSelectedSlotId(null); setSelectedSlotSnapshot(null); }} disabled={!dates.length}><option value="" disabled>{availability.isLoading ? "Finding open times…" : "Select an available date"}</option>{dates.map(date => <option value={date} key={date}>{prettyDate(date)}</option>)}</select></label></div>
            <div className="slots-heading"><span>AVAILABLE APPOINTMENT TIMES</span><span><Clock3 size={13} /> Times shown in each slot’s clinic time zone</span></div>
            {availability.isLoading ? <div className="availability-message"><Loader2 className="spin" size={17} /> Checking current availability…</div> : availability.error ? <div className="availability-message error">Calendar availability is temporarily unavailable. Please try again, or request another time.</div> : dates.length === 0 ? <div className="availability-message">No appointment times have been published yet. You can request another time and the clinic will follow up.</div> : visibleSlots.length === 0 ? <div className="availability-message">No open times match this therapist and date. Choose another date or therapist, or request another time.</div> : <div className="available-slots" role="radiogroup" aria-label="Available appointment times">{visibleSlots.map(slot => <button type="button" role="radio" aria-checked={selectedSlotId === slot.id} className={`available-slot ${selectedSlotId === slot.id ? "selected" : ""}`} key={slot.id} onClick={() => { setSelectedSlotId(slot.id); setSelectedSlotSnapshot({ date: slot.date, startTime: slot.startTime, timezone: slot.timezone, therapist: slot.therapist as Exclude<Therapist, "Any therapist">, durationMinutes: slot.durationMinutes }); }}><strong>{slot.startTime}</strong><span>{slot.durationMinutes} min · {slot.therapist}</span><small>{slot.timezone}</small></button>)}</div>}
          </> : <>
            <label>Preferred therapist<select value={form.therapist} onChange={event => setField("therapist", event.target.value as Therapist)}>{therapists.map(therapist => <option key={therapist}>{therapist}</option>)}</select></label>
            <div className="form-row"><label>Preferred date<input required type="date" min={localDateOffset(0)} value={form.date} onChange={event => setField("date", event.target.value)} /></label><label>Preferred time<input required type="time" value={form.time} onChange={event => setField("time", event.target.value)} /></label></div>
          </>}
          <div className="form-row"><label>Full name<input required maxLength={120} value={form.name} onChange={event => setField("name", event.target.value)} placeholder="Your name" /></label><label>Email address<input required type="email" maxLength={254} value={form.email} onChange={event => setField("email", event.target.value)} placeholder="you@example.com" /></label></div>
          <div className="form-row"><label>Phone <small>(optional)</small><input type="tel" maxLength={30} value={form.phone} onChange={event => setField("phone", event.target.value)} placeholder="Your phone number" /></label><label>What brings you in?<select required value={form.service} onChange={event => setField("service", event.target.value as Service | "")}><option value="" disabled>Select a service</option>{services.map(service => <option key={service}>{service}</option>)}</select></label></div>
          <p className="form-note">Calendar reservations remain pending until staff confirms them. Requests for a different time are not bookings. Please don’t include medical history or urgent concerns.</p>
          {error && <p className="form-error" role="alert">{error.data?.code === "CONFLICT" ? "That time was just taken. Refresh the calendar and select another slot." : "We couldn’t send your request. Please try again."}</p>}
          <button className="button button-dark form-submit" type="submit" disabled={isPending || (mode === "calendar" && !selectedSlotId)}>{isPending ? "Sending request…" : mode === "calendar" ? "Reserve this time" : "Send appointment request"}<ArrowRight size={17} /></button>
        </form>
      </>}
    </div>
  </div>;
}
