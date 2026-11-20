import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, Check, Clock3, LogIn, LogOut, Pencil, Plus, RefreshCw, ShieldCheck, X } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type Therapist = "Therapist 1" | "Therapist 2" | "Therapist 3";
type CalendarSlot = {
  slot: { id: number; date: string; startTime: string; timezone: string; therapist: string; durationMinutes: number; status: string };
  appointment: null | { id: number; name: string; email: string; phone: string | null; service: string; status: string };
};
type SlotDraft = { date: string; startTime: string; timezone: string; therapist: Therapist; durationMinutes: number };
const therapists: Therapist[] = ["Therapist 1", "Therapist 2", "Therapist 3"];
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const displayDate = (value: string) => new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
const statusLabel: Record<string, string> = { available: "Available", reserved: "Awaiting confirmation", confirmed: "Confirmed", cancelled: "Cancelled" };

export default function StaffCalendar() {
  useEffect(() => {
    const originalTitle = document.title;
    const existingRobots = document.querySelector('meta[name="robots"]');
    const robots = existingRobots ?? document.createElement("meta");
    const originalRobots = robots.getAttribute("content");
    robots.setAttribute("name", "robots");
    robots.setAttribute("content", "noindex, nofollow");
    if (!existingRobots) document.head.appendChild(robots);
    document.title = "Staff Calendar | Motion Physio";
    return () => {
      document.title = originalTitle;
      if (existingRobots) {
        if (originalRobots === null) robots.removeAttribute("content");
        else robots.setAttribute("content", originalRobots);
      } else robots.remove();
    };
  }, []);

  const user = trpc.auth.me.useQuery();
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => { window.location.href = "/"; } });
  const [date, setDate] = useState(today());
  const [startTime, setStartTime] = useState("09:00");
  const [timezone, setTimezone] = useState("");
  const [therapist, setTherapist] = useState<Therapist>("Therapist 1");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [slotDraft, setSlotDraft] = useState<SlotDraft | null>(null);

  const calendar = trpc.calendar.staff.list.useQuery(undefined, { enabled: Boolean(user.data), refetchInterval: 15_000, retry: false });
  const utils = trpc.useUtils();
  const refresh = () => utils.calendar.staff.list.invalidate();
  const addSlot = trpc.calendar.staff.addSlot.useMutation({ onSuccess: refresh });
  const updateSlot = trpc.calendar.staff.updateSlot.useMutation({ onSuccess: () => { setEditingSlotId(null); setSlotDraft(null); void refresh(); } });
  const confirm = trpc.calendar.staff.confirm.useMutation({ onSuccess: refresh });
  const cancel = trpc.calendar.staff.cancel.useMutation({ onSuccess: refresh });
  const rows = (calendar.data ?? []) as CalendarSlot[];
  const upcoming = useMemo(() => [...rows]
    .filter(row => row.slot.date >= today())
    .sort((a, b) => `${a.slot.date} ${a.slot.startTime}`.localeCompare(`${b.slot.date} ${b.slot.startTime}`)), [rows]);

  function submit(event: FormEvent) {
    event.preventDefault();
    addSlot.mutate({ date, startTime, timezone: timezone.trim(), therapist, durationMinutes });
  }
  function beginEdit(slot: CalendarSlot["slot"]) {
    setEditingSlotId(slot.id);
    setSlotDraft({ date: slot.date, startTime: slot.startTime, timezone: slot.timezone, therapist: slot.therapist as Therapist, durationMinutes: slot.durationMinutes });
    updateSlot.reset();
  }
  function submitEdit(event: FormEvent, slotId: number) {
    event.preventDefault();
    if (slotDraft) updateSlot.mutate({ slotId, ...slotDraft });
  }
  function updateDraft<K extends keyof SlotDraft>(key: K, value: SlotDraft[K]) {
    setSlotDraft(current => current ? { ...current, [key]: value } : current);
  }

  if (user.isLoading) return <main className="staff-page"><div className="staff-gate"><span className="eyebrow"><span /> MOTION PHYSIO STAFF</span><p>Checking access…</p></div></main>;
  if (!user.data) return <main className="staff-page"><Link className="staff-back" href="/"><ArrowLeft size={16} /> Back to Motion Physio</Link><div className="staff-gate"><div className="staff-gate-icon"><ShieldCheck size={25} /></div><span className="eyebrow"><span /> STAFF ACCESS</span><h1>Sign in to the<br /><em>internal calendar.</em></h1><p>Calendar availability and patient reservations are available to authorized Motion Physio staff only.</p><button className="button button-dark" onClick={() => startLogin()}>Sign in with Manus <LogIn size={16} /></button></div></main>;
  if (calendar.error?.data?.code === "FORBIDDEN") return <main className="staff-page"><Link className="staff-back" href="/"><ArrowLeft size={16} /> Back to Motion Physio</Link><div className="staff-gate"><div className="staff-gate-icon"><ShieldCheck size={25} /></div><span className="eyebrow"><span /> STAFF ACCESS</span><h1>Calendar access<br /><em>is restricted.</em></h1><p>This signed-in account is not configured as a calendar administrator. Ask the clinic owner to authorize a staff account.</p><button className="button button-dark" onClick={() => user.refetch()}>Check access again <RefreshCw size={16} /></button><button className="staff-secondary" onClick={() => startLogin()}>Sign in with a different account</button></div></main>;

  return <main className="staff-page">
    <header className="staff-header">
      <Link className="staff-back" href="/"><ArrowLeft size={16} /> Motion Physio</Link>
      <div className="staff-user"><div><span className="tiny-label">SIGNED IN AS</span><strong>{user.data.name || user.data.email || "Motion Physio staff"}</strong></div><button aria-label="Sign out" title="Sign out" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut size={17} /></button></div>
    </header>
    <div className="staff-content">
      <div className="staff-title-row"><div><span className="eyebrow"><span /> INTERNAL · NO EXTERNAL CALENDAR</span><h1>Clinic <em>calendar.</em></h1><p>Publish specific appointment times, review reservations, and keep clinic availability current.</p></div><button className="staff-refresh" onClick={() => calendar.refetch()}><RefreshCw size={15} /> Refresh</button></div>
      {calendar.error && <div className="staff-alert">The calendar could not be loaded. Please refresh and try again.</div>}
      <div className="staff-layout">
        <section className="staff-create"><span className="tiny-label">PUBLISH AN OPEN APPOINTMENT</span><h2><Plus size={19} /> Add a time slot</h2><p>Every slot uses the time zone entered below. Overlapping times for that therapist are rejected.</p>
          <form onSubmit={submit} className="staff-form">
            <label>Date<input type="date" min={today()} required value={date} onChange={event => setDate(event.target.value)} /></label>
            <label>Start time<input type="time" required value={startTime} onChange={event => setStartTime(event.target.value)} /></label>
            <label>Clinic time zone (IANA)<input required maxLength={64} value={timezone} onChange={event => setTimezone(event.target.value)} placeholder="e.g. America/Chicago" /><small>Use your clinic’s IANA time zone.</small></label>
            <div className="form-row"><label>Therapist<select value={therapist} onChange={event => setTherapist(event.target.value as Therapist)}>{therapists.map(name => <option key={name}>{name}</option>)}</select></label><label>Visit length<select value={durationMinutes} onChange={event => setDurationMinutes(Number(event.target.value))}><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={75}>75 min</option><option value={90}>90 min</option><option value={120}>120 min</option></select></label></div>
            {addSlot.error && <p className="form-error" role="alert">{addSlot.error.data?.code === "CONFLICT" ? "This time overlaps another slot for that therapist." : "Could not publish the slot. Check the date, time zone, and details."}</p>}
            <button className="button button-dark" type="submit" disabled={addSlot.isPending}>{addSlot.isPending ? "Publishing…" : "Publish availability"}<Plus size={16} /></button>
          </form>
        </section>
        <section className="staff-slots">
          <div className="staff-slots-heading"><div><span className="tiny-label">UPCOMING AVAILABILITY & APPOINTMENTS</span><h2><CalendarDays size={20} /> Calendar</h2></div><span className="staff-count">{upcoming.length} slots</span></div>
          {calendar.isLoading ? <p className="staff-empty">Loading internal calendar…</p> : upcoming.length === 0 ? <div className="staff-empty"><CalendarDays size={24} /><strong>No slots published yet.</strong><span>Add a time slot to make it available for appointment requests.</span></div> : <div className="staff-slot-list">{upcoming.map(row => <article className="staff-slot" key={row.slot.id}>
            <div className="staff-slot-time"><strong>{row.slot.startTime}</strong><span>{displayDate(row.slot.date)}</span></div>
            <div className="staff-slot-info"><div className="staff-slot-top"><span className={`status-pill status-${row.slot.status}`}>{statusLabel[row.slot.status] || row.slot.status}</span><span className="staff-zone">{row.slot.timezone}</span></div><p>{row.slot.therapist} · {row.slot.durationMinutes} minutes</p>
              {row.appointment && row.appointment.status !== "cancelled" && <div className="staff-patient"><strong>{row.appointment.name}</strong><span>{row.appointment.email}{row.appointment.phone ? ` · ${row.appointment.phone}` : ""}</span><small>{row.appointment.service} · {row.appointment.status === "pending" ? "Pending staff confirmation" : "Confirmed"}</small></div>}
              {editingSlotId === row.slot.id && slotDraft ? <form className="staff-edit" onSubmit={event => submitEdit(event, row.slot.id)}>
                <div className="staff-edit-grid"><label>Date<input type="date" min={today()} required value={slotDraft.date} onChange={event => updateDraft("date", event.target.value)} /></label><label>Start time<input type="time" required value={slotDraft.startTime} onChange={event => updateDraft("startTime", event.target.value)} /></label><label>Time zone (IANA)<input required maxLength={64} value={slotDraft.timezone} onChange={event => updateDraft("timezone", event.target.value)} /></label><label>Therapist<select value={slotDraft.therapist} onChange={event => updateDraft("therapist", event.target.value as Therapist)}>{therapists.map(name => <option key={name}>{name}</option>)}</select></label><label>Visit length<select value={slotDraft.durationMinutes} onChange={event => updateDraft("durationMinutes", Number(event.target.value))}><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={75}>75 min</option><option value={90}>90 min</option><option value={120}>120 min</option></select></label></div>
                {updateSlot.error && <p className="form-error" role="alert">{updateSlot.error.data?.code === "CONFLICT" ? "This slot has changed, is booked, or overlaps another slot." : "Could not update the slot. Check the details."}</p>}
                <div className="staff-edit-actions"><button type="submit" disabled={updateSlot.isPending}>{updateSlot.isPending ? "Saving…" : "Save changes"}</button><button type="button" onClick={() => { setEditingSlotId(null); setSlotDraft(null); }}>Cancel edit</button></div>
              </form> : null}
            </div>
            <div className="staff-slot-actions">
              {row.slot.status === "available" && <button onClick={() => beginEdit(row.slot)}><Pencil size={14} /> Edit</button>}
              {row.slot.status === "reserved" && <button className="staff-confirm" onClick={() => confirm.mutate({ slotId: row.slot.id })} disabled={confirm.isPending}><Check size={14} /> Confirm</button>}
              {["reserved", "confirmed"].includes(row.slot.status) && <button className="staff-cancel" onClick={() => { if (window.confirm("Cancel this appointment and return the time to availability?")) cancel.mutate({ slotId: row.slot.id }); }} disabled={cancel.isPending}><X size={14} /> Cancel</button>}
            </div>
          </article>)}</div>}
        </section>
      </div>
      <p className="staff-privacy"><ShieldCheck size={15} /> Patient contact details are visible only to authorized calendar staff. New reservations stay pending until confirmed here.</p>
    </div>
  </main>;
}
