import { useState } from "react";
import { ArrowUpRight, Check, MousePointer2 } from "lucide-react";

type Area = "Shoulder" | "Elbow" | "Back" | "Hip" | "Knee" | "Ankle";

const areas: Record<Area, { x: string; y: string; description: string; steps: string[] }> = {
  Shoulder: { x: "33%", y: "23%", description: "From reaching overhead to getting back in the game, shoulder care starts with understanding how you move.", steps: ["A conversation about your movement and goals", "Mobility and strength work, where appropriate", "A plan tailored to your activities"] },
  Elbow: { x: "25%", y: "40%", description: "We can explore the movements and activities that matter to you, and discuss appropriate next steps.", steps: ["An individual movement assessment", "Progressive strength and mobility work", "Guidance for returning to activity"] },
  Back: { x: "50%", y: "38%", description: "Whether you want to move more comfortably or return to sport, your plan begins with your goals.", steps: ["A review of your movement and activity", "Individualized mobility and strength exercises", "A gradual approach to the things you love"] },
  Hip: { x: "42%", y: "56%", description: "Explore a thoughtful approach to hip mobility, strength, and the movements you want to get back to.", steps: ["A conversation about your goals", "Mobility and strengthening, as appropriate", "A plan that evolves with your progress"] },
  Knee: { x: "40%", y: "75%", description: "From sports injuries to post-surgery rehabilitation, we help you find your next step forward.", steps: ["A personalized movement assessment", "Strength and mobility exercises", "A gradual return-to-activity plan"] },
  Ankle: { x: "38%", y: "91%", description: "Build a plan around your needs, whether your goal is everyday movement or getting back to sport.", steps: ["A review of movement and balance", "Progressive mobility and strength work", "Guidance for a return to activity"] },
};

export default function BodyMap({ onBook }: { onBook: () => void }) {
  const [selected, setSelected] = useState<Area>("Knee");
  const current = areas[selected];
  return (
    <section className="body-section" id="areas">
      <div className="section-wrap body-intro">
        <div><span className="eyebrow"><span /> FIND YOUR FOCUS</span><h2>Let’s meet you<br /><em>where you are.</em></h2></div>
        <p>Every body has a story. Select an area to explore how a personalized approach to care might help you move forward.</p>
      </div>
      <div className="section-wrap body-map-card">
        <div className="map-left">
          <div className="map-caption"><span className="tiny-label">INTERACTIVE BODY MAP</span><span><MousePointer2 size={15} /> Select an area</span></div>
          <div className="map-visual">
            <div className="body-figure" aria-label="Select a body area">
              <svg viewBox="0 0 280 500" role="img" aria-label="Illustration of the human body"><g fill="#cbdac7" stroke="#a8bfa7" strokeWidth="1.5"><ellipse cx="140" cy="45" rx="27" ry="34"/><path d="M122 78 Q140 86 158 78 L164 92 Q181 96 194 106 L188 157 Q177 191 177 220 L183 264 Q180 278 168 283 L112 283 Q100 278 97 264 L103 220 Q103 191 92 157 L86 106 Q99 96 116 92 Z"/><path d="M86 106 Q72 108 66 125 L51 174 L37 224 Q35 231 41 235 Q47 238 51 231 L69 191 L87 153 L96 130 Z"/><path d="M194 106 Q208 108 214 125 L229 174 L243 224 Q245 231 239 235 Q233 238 229 231 L211 191 L193 153 L184 130 Z"/><path d="M111 274 Q103 301 104 325 L106 384 L100 447 Q99 458 94 468 L92 477 Q93 483 103 483 L120 483 Q126 481 125 476 L122 465 L127 392 L140 309 L153 392 L158 465 L155 476 Q154 481 160 483 L177 483 Q187 483 188 477 L186 468 Q181 458 180 447 L174 384 L176 325 Q177 301 169 274 Z"/></g><path d="M140 310 L140 285" stroke="#a8bfa7" strokeWidth="1.5" fill="none"/></svg>
              {(Object.keys(areas) as Area[]).map(area => <button key={area} className={`body-hotspot ${selected === area ? "active" : ""}`} style={{ left: areas[area].x, top: areas[area].y }} onClick={() => setSelected(area)} aria-label={`Show ${area.toLowerCase()} treatment information`} aria-pressed={selected === area}><span /></button>)}
            </div>
            <span className="map-note">Select a point<br />to explore care</span>
          </div>
          <div className="area-pills" aria-label="Body areas">{(Object.keys(areas) as Area[]).map(area => <button key={area} onClick={() => setSelected(area)} aria-pressed={selected === area} className={selected === area ? "selected" : ""}>{area}</button>)}</div>
        </div>
        <div className="map-detail" aria-live="polite">
          <span className="tiny-label">YOUR SELECTED AREA <span className="detail-number">01 / 06</span></span>
          <div className="detail-heading"><div className="detail-icon">✳</div><div><h3>{selected} care</h3><p>A plan for your kind of movement.</p></div></div>
          <p className="detail-copy">{current.description}</p>
          <div className="detail-rule" />
          <span className="tiny-label">YOUR CARE MAY INCLUDE</span>
          <ul>{current.steps.map(step => <li key={step}><span><Check size={14} strokeWidth={2} /></span>{step}</li>)}</ul>
          <button className="text-link" onClick={onBook}>Let’s talk about your goals <ArrowUpRight size={17} /></button>
        </div>
      </div>
      <p className="map-disclaimer section-wrap">This map is for general information, not diagnosis. Your therapist will discuss a plan appropriate to you.</p>
    </section>
  );
}
