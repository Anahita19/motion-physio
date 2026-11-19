import { useState, type FormEvent } from "react";
import { ArrowUp, MessageCircle, X } from "lucide-react";

type Message = { from: "assistant" | "visitor"; text: string };
const suggestions = ["What is the first visit price?", "Do you accept insurance?", "How do I request a visit?"];

function answer(question: string): string {
  const q = question.toLowerCase();
  if (/emergency|urgent|severe|chest pain/.test(q)) return "If you have urgent or severe symptoms, please seek appropriate medical care. This chat cannot assess emergencies.";
  if (/insurance|coverage|cover|plan|network/.test(q)) return "Coverage and accepted plans have not yet been confirmed. Please check with your insurer and ask the clinic about its current insurance and payment arrangements.";
  if (/cost|price|pricing|pay|\$|fee|charge/.test(q)) return "Your first visit is $120. Please ask the clinic about pricing for any follow-up visits and what your plan may cover.";
  if (/book|appointment|schedule|request|available/.test(q)) return "Choose ‘Request an appointment’ and share your preferred service, therapist, date and time. The clinic can follow up; your request is not a confirmed booking.";
  if (/first|visit|expect|bring/.test(q)) return "The first visit costs $120. Your therapist can learn about your goals and discuss an approach suited to you. Ask the clinic about anything you may need to bring.";
  if (/sport|injur|surgery|surgical|rehab|treat|service|help/.test(q)) return "Motion Physio focuses on sports injuries and post-surgery rehabilitation. A therapist can discuss whether our care is appropriate for your needs.";
  if (/therapist|team|staff|who/.test(q)) return "Our team includes three therapists. Individual names, credentials and profiles will be added when confirmed.";
  if (/time|long|recover|outcome/.test(q)) return "Recovery is different for everyone. A therapist can discuss your goals and possible next steps, but this chat cannot predict a timeline.";
  if (/where|location|address|hour|open|phone|contact/.test(q)) return "Our location, hours and contact details have not been added yet. You can send an appointment request using the button on this page.";
  return "I can help with common questions about our services, the $120 first visit, insurance, and appointment requests. Try asking about one of those topics.";
}

export default function ChatAssistant({ onBook }: { onBook: () => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ from: "assistant", text: "Hi there! I’m here to help with common questions about Motion Physio. What would you like to know?" }]);
  function send(text: string) {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { from: "visitor", text: text.trim() }, { from: "assistant", text: answer(text) }]);
    setInput("");
  }
  function submit(event: FormEvent) { event.preventDefault(); send(input); }
  return <div className="chat-shell">
    {open && <div className="chat-panel" role="dialog" aria-label="Motion Physio common questions">
      <div className="chat-header"><div className="chat-avatar">✳</div><div><strong>Here to help</strong><small>Motion Physio assistant</small></div><button onClick={() => setOpen(false)} aria-label="Close chat"><X size={19} /></button></div>
      <div className="chat-messages" aria-live="polite">{messages.map((message, i) => <div className={`chat-message ${message.from}`} key={i}>{message.text}</div>)}{messages.length === 1 && <div className="chat-suggestions">{suggestions.map(q => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>}</div>
      <button className="chat-book" onClick={() => { setOpen(false); onBook(); }}>Request an appointment ↗</button>
      <form onSubmit={submit} className="chat-input"><input aria-label="Ask a question" placeholder="Type your question…" value={input} onChange={e => setInput(e.target.value)} /><button aria-label="Send question" type="submit"><ArrowUp size={17} /></button></form>
      <p className="chat-foot">General information only, not medical advice.</p>
    </div>}
    <button className="chat-toggle" onClick={() => setOpen(!open)} aria-label={open ? "Close chat assistant" : "Open chat assistant"}>{open ? <X size={22} /> : <MessageCircle size={23} />}<span>Have a question?</span></button>
  </div>;
}
