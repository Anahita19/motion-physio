import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

const blank = { name: "", email: "", phone: "", service: "", therapist: "Any therapist", date: "", time: "" };
const services = ["Sports injury", "Post-surgery rehab", "Not sure yet"] as const;
const therapists = ["Any therapist", "Therapist 1", "Therapist 2", "Therapist 3"] as const;
export default function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState(blank);
  const [success, setSuccess] = useState(false);
  const booking = trpc.booking.create.useMutation({ onSuccess: () => setSuccess(true) });
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [open, onClose]);
  if (!open) return null;
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  function submit(event: FormEvent) {
    event.preventDefault();
    const service = services.find(item => item === form.service);
    const therapist = therapists.find(item => item === form.therapist);
    if (service && therapist) booking.mutate({ ...form, service, therapist });
  }
  function close() { onClose(); setTimeout(() => { setSuccess(false); setForm(blank); booking.reset(); }, 250); }
  const change = (name: keyof typeof blank, value: string) => setForm(prev => ({ ...prev, [name]: value }));
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
    <div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <button className="modal-close" onClick={close} aria-label="Close appointment request"><X size={20} /></button>
      {success ? <div className="booking-success"><span className="success-icon"><Check size={26} /></span><span className="eyebrow">REQUEST RECEIVED</span><h2 id="booking-title">A good first step.</h2><p>Your appointment request has been received. It is not a confirmed booking; the clinic can follow up about availability and next steps.</p><button className="button button-dark" onClick={close}>Back to the website <ArrowRight size={17} /></button></div> : <><span className="eyebrow"><span /> LET’S GET MOVING</span><h2 id="booking-title">Request an appointment.</h2><p className="modal-intro">Tell us what works for you. We’ll use these details to follow up about availability. Your first visit is <strong>$120</strong>.</p>
        <form onSubmit={submit} className="booking-form">
          <div className="form-row"><label>Full name<input required maxLength={120} value={form.name} onChange={e => change("name", e.target.value)} placeholder="Your name" /></label><label>Email address<input required type="email" maxLength={254} value={form.email} onChange={e => change("email", e.target.value)} placeholder="you@example.com" /></label></div>
          <div className="form-row"><label>Phone <small>(optional)</small><input type="tel" maxLength={30} value={form.phone} onChange={e => change("phone", e.target.value)} placeholder="Your phone number" /></label><label>What brings you in?<select required value={form.service} onChange={e => change("service", e.target.value)}><option value="" disabled>Select a service</option><option>Sports injury</option><option>Post-surgery rehab</option><option>Not sure yet</option></select></label></div>
          <label>Therapist preference<select value={form.therapist} onChange={e => change("therapist", e.target.value)}><option>Any therapist</option><option>Therapist 1</option><option>Therapist 2</option><option>Therapist 3</option></select></label>
          <div className="form-row"><label>Preferred date<input required type="date" min={minDate} value={form.date} onChange={e => change("date", e.target.value)} /></label><label>Preferred time<input required type="time" value={form.time} onChange={e => change("time", e.target.value)} /></label></div>
          <p className="form-note">This is a request, not a confirmed appointment. Please do not include medical history or urgent concerns. Your contact details and preferences are shared with the clinic to respond to your request.</p>
          {booking.error && <p className="form-error" role="alert">We couldn’t send your request. Please try again.</p>}
          <button className="button button-dark form-submit" type="submit" disabled={booking.isPending}>{booking.isPending ? "Sending request…" : "Send appointment request"}<ArrowRight size={17} /></button>
        </form></>}
    </div>
  </div>;
}
