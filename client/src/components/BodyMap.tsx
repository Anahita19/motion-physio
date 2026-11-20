import { useState } from "react";
import { ArrowUpRight, Check, MousePointer2 } from "lucide-react";

type Region =
  | "Neck"
  | "Shoulder"
  | "Upper arm"
  | "Elbow"
  | "Wrist & hand"
  | "Upper back"
  | "Lower back"
  | "Hip"
  | "Thigh"
  | "Knee"
  | "Lower leg"
  | "Ankle & foot";

type RegionInfo = {
  x: string;
  y: string;
  focus: string;
  description: string;
  steps: string[];
};

const regions: Record<Region, RegionInfo> = {
  Neck: {
    x: "50%", y: "16%", focus: "Comfortable everyday movement",
    description: "Start with the movements that feel important to you. A therapist can hear what you want to work on and discuss options suited to your situation.",
    steps: ["Talk through your goals and movement", "Explore comfortable mobility options", "Build a paced plan around daily activities"],
  },
  Shoulder: {
    x: "35%", y: "24%", focus: "Reaching, lifting, and sport",
    description: "Shoulder care can be shaped around the activities you want to return to, from everyday reaching to training and sport.",
    steps: ["Discuss movement and activity goals", "Explore shoulder mobility and strength", "Progress activity at a suitable pace"],
  },
  "Upper arm": {
    x: "30%", y: "32%", focus: "Strength and upper-limb activity",
    description: "A personalized approach can consider how the upper arm works with your shoulder and elbow during the tasks that matter to you.",
    steps: ["Review relevant movements and activities", "Consider progressive strength work", "Adapt practice to your goals"],
  },
  Elbow: {
    x: "25%", y: "41%", focus: "Daily tasks and return to activity",
    description: "Your therapist can discuss which movements and activities you hope to work toward and whether rehabilitation may be appropriate.",
    steps: ["Discuss your activity and movement goals", "Explore mobility and strengthening options", "Plan gradual task or sport progression"],
  },
  "Wrist & hand": {
    x: "21%", y: "49%", focus: "Grip, dexterity, and daily routines",
    description: "Care can be considered in context: the hand and wrist demands of work, home life, hobbies, or sport are different for everyone.",
    steps: ["Review meaningful hand-use activities", "Explore suitable movement and strength work", "Practice a gradual return to chosen tasks"],
  },
  "Upper back": {
    x: "50%", y: "34%", focus: "Posture, rotation, and sport",
    description: "A therapist can learn about the movements you want to improve and discuss an individualized approach to upper-back mobility and activity.",
    steps: ["Talk through your movement and activity", "Explore mobility and trunk-control exercises", "Build toward your everyday or sport goals"],
  },
  "Lower back": {
    x: "50%", y: "45%", focus: "Building confidence with movement",
    description: "If you are looking for support with movement or a return to activity, your plan can start with your goals and personal circumstances.",
    steps: ["Discuss activity and movement priorities", "Explore appropriate mobility and strength work", "Progress activity in manageable steps"],
  },
  Hip: {
    x: "43%", y: "56%", focus: "Mobility, strength, and activity",
    description: "From daily movement to sport, hip-related care begins with what you would like to get back to and an individualized discussion.",
    steps: ["Review your movement and activity goals", "Consider hip and lower-body strength", "Progress toward personally relevant activities"],
  },
  Thigh: {
    x: "39%", y: "68%", focus: "Lower-body strength and return to sport",
    description: "A therapist can help you explore an appropriate path toward lower-body activity, tailored to your sport, goals, and stage of rehabilitation.",
    steps: ["Discuss sport and activity requirements", "Explore progressive strength options", "Build a gradual return-to-activity plan"],
  },
  Knee: {
    x: "39%", y: "77%", focus: "Sport and post-surgery rehabilitation",
    description: "Whether you are seeking support for a sports injury or after surgery, the right approach depends on an individual assessment and relevant clinical guidance.",
    steps: ["Review your goals and relevant guidance", "Consider progressive knee strength and mobility", "Plan activity progression around your needs"],
  },
  "Lower leg": {
    x: "40%", y: "86%", focus: "Strength, balance, and activity",
    description: "Your lower-leg plan can reflect the demands of walking, work, exercise, and sport—progressed thoughtfully around your situation.",
    steps: ["Discuss walking and activity goals", "Explore suitable strength and balance work", "Progress activity at an appropriate pace"],
  },
  "Ankle & foot": {
    x: "41%", y: "94%", focus: "Balance and a steady return to movement",
    description: "From everyday steps to sport, a therapist can discuss suitable ways to work on ankle and foot movement in the context of your goals.",
    steps: ["Review movement and balance priorities", "Explore mobility and strengthening options", "Work gradually toward chosen activities"],
  },
};

export default function BodyMap({ onBook }: { onBook: () => void }) {
  const [selected, setSelected] = useState<Region>("Knee");
  const current = regions[selected];
  const regionNames = Object.keys(regions) as Region[];
  const index = regionNames.indexOf(selected) + 1;
  const choose = (region: Region) => setSelected(region);

  return (
    <section className="body-section" id="areas">
      <div className="section-wrap body-intro">
        <div>
          <span className="eyebrow"><span /> FIND YOUR FOCUS</span>
          <h2>Let’s meet you<br /><em>where you are.</em></h2>
        </div>
        <p>Every body has a story. Select from twelve regions to explore care approaches shaped around your goals and individual circumstances.</p>
      </div>
      <div className="section-wrap body-map-card">
        <div className="map-left">
          <div className="map-caption">
            <span className="tiny-label">INTERACTIVE BODY MAP</span>
            <span><MousePointer2 size={15} /> Select an area</span>
          </div>
          <div className="map-visual">
            <div className="body-figure" aria-label="Select a region on the body map">
              <svg viewBox="0 0 280 500" role="img" aria-label="Illustration of the human body">
                <g fill="#cbdac7" stroke="#a8bfa7" strokeWidth="1.5">
                  <ellipse cx="140" cy="45" rx="27" ry="34" />
                  <path d="M122 78 Q140 86 158 78 L164 92 Q181 96 194 106 L188 157 Q177 191 177 220 L183 264 Q180 278 168 283 L112 283 Q100 278 97 264 L103 220 Q103 191 92 157 L86 106 Q99 96 116 92 Z" />
                  <path d="M86 106 Q72 108 66 125 L51 174 L37 224 Q35 231 41 235 Q47 238 51 231 L69 191 L87 153 L96 130 Z" />
                  <path d="M194 106 Q208 108 214 125 L229 174 L243 224 Q245 231 239 235 Q233 238 229 231 L211 191 L193 153 L184 130 Z" />
                  <path d="M111 274 Q103 301 104 325 L106 384 L100 447 Q99 458 94 468 L92 477 Q93 483 103 483 L120 483 Q126 481 125 476 L122 465 L127 392 L140 309 L153 392 L158 465 L155 476 Q154 481 160 483 L177 483 Q187 483 188 477 L186 468 Q181 458 180 447 L174 384 L176 325 Q177 301 169 274 Z" />
                </g>
                <path d="M140 310 L140 285" stroke="#a8bfa7" strokeWidth="1.5" fill="none" />
              </svg>
              {regionNames.map(region => (
                <button
                  key={region}
                  className={`body-hotspot ${selected === region ? "active" : ""}`}
                  style={{ left: regions[region].x, top: regions[region].y }}
                  onClick={() => choose(region)}
                  aria-label={`Show ${region.toLowerCase()} care information`}
                  aria-pressed={selected === region}
                  title={region}
                ><span /></button>
              ))}
            </div>
            <span className="map-note">Select a point<br />to explore care</span>
          </div>
          <div className="area-pills" aria-label="Body regions">
            {regionNames.map(region => (
              <button key={region} onClick={() => choose(region)} aria-pressed={selected === region} className={selected === region ? "selected" : ""}>{region}</button>
            ))}
          </div>
        </div>
        <div className="map-detail" aria-live="polite" aria-atomic="true">
          <span className="tiny-label">YOUR SELECTED AREA <span className="detail-number">{String(index).padStart(2, "0")} / {String(regionNames.length).padStart(2, "0")}</span></span>
          <div className="detail-heading">
            <div className="detail-icon">✳</div>
            <div><h3>{selected} care</h3><p>{current.focus}</p></div>
          </div>
          <p className="detail-copy">{current.description}</p>
          <div className="detail-rule" />
          <span className="tiny-label">A PERSONALIZED PLAN MAY INCLUDE</span>
          <ul>{current.steps.map(step => <li key={step}><span><Check size={14} strokeWidth={2} /></span>{step}</li>)}</ul>
          <button className="text-link" onClick={onBook}>Let’s talk about your goals <ArrowUpRight size={17} /></button>
        </div>
      </div>
      <p className="map-disclaimer section-wrap">General information only, not diagnosis or medical advice. Treatment is individualized after discussion with a therapist; recommendations may depend on your circumstances and, after surgery, your care team’s guidance.</p>
    </section>
  );
}
