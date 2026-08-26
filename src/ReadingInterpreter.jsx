import { useState, useRef, useEffect } from "react";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

const SANS = "'Plus Jakarta Sans','system-ui',sans-serif";
const SERIF = "'Crimson Text','Georgia',serif";

const c = {
  bg: "#faf8f4",
  bgHeader: "#f3f0e9",
  bgInput: "#ede8dd",
  border: "rgba(100,80,60,0.1)",
  borderMid: "rgba(100,80,60,0.18)",
  accent: "#2d5a3d",
  accentLight: "rgba(45,90,61,0.08)",
  accentMid: "rgba(45,90,61,0.18)",
  accentPop: "#c17f3a",
  textPrimary: "#1e1a16",
  textSecondary: "#5c5147",
  textMuted: "rgba(30,26,22,0.38)",
  userBubble: "#ede8dd",
  userBubbleBorder: "rgba(100,80,60,0.18)",
};

// ---- SCROLL HELPERS ----
// Carried over unchanged from the consumer app — the chat screen (after the
// panel generates) still needs reliable scroll-to-top-of-response behavior
// on step transitions and new messages landing. The intake side no longer
// needs any of this, since it's a single static page with no step
// transitions of its own.

function ensureHeaderVisible() {
  try {
    const headerEl = document.getElementById("app-header");
    if (!headerEl) return;
    const rect = headerEl.getBoundingClientRect();
    if (Math.round(rect.top) !== 0) {
      const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const target = Math.max(0, currentScroll + rect.top);
      window.scrollTo({ top: target, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = target;
      document.body.scrollTop = target;
    }
  } catch {}
}

// Parses panel output into entry blocks. The system prompt guarantees a
// specific shape: a bold-wrapped paragraph ("**Entry Name**") marks the
// start of an entry, every paragraph after it belongs to that entry until
// the next header, and the LAST paragraph of a header'd entry is always the
// guiding question, on its own paragraph. Content with no headers at all
// (a follow-up chat answer that isn't itself a formatted panel) is handled
// too — it just renders as plain paragraphs with no header and no
// guiding-question styling, since there's no reliable signal for which
// paragraph, if any, is a question in freeform conversation.
function parsePanelBlocks(content) {
  const paragraphs = content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const headerRe = /^\*\*(.+?)\*\*$/;
  const blocks = [];
  let current = null;
  for (const p of paragraphs) {
    const m = p.match(headerRe);
    if (m) {
      if (current) blocks.push(current);
      current = { header: m[1], paragraphs: [] };
    } else {
      if (!current) current = { header: null, paragraphs: [] };
      current.paragraphs.push(p);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function formatMessage(content) {
  const blocks = parsePanelBlocks(content);
  return (
    <div>
      {blocks.map((block, bi) => (
        <div key={bi} style={{ marginBottom: "1.75rem" }}>
          {block.header && (
            <div style={{ fontSize: "19px", fontWeight: 700, fontFamily: SANS, color: c.textPrimary, marginBottom: "0.75rem" }}>
              {block.header}
            </div>
          )}
          {block.paragraphs.map((p, pi) => {
            const isGuidingQuestion = !!block.header && pi === block.paragraphs.length - 1 && /\?\s*$/.test(p.trim());
            if (isGuidingQuestion) {
              return (
                <div
                  key={pi}
                  style={{ marginTop: "1rem", background: c.accentLight, borderLeft: `3px solid ${c.accent}`, borderRadius: "0 8px 8px 0", padding: "0.85rem 1.1rem" }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: c.accent, marginBottom: "0.35rem", fontFamily: SANS }}>
                    Worth Exploring
                  </div>
                  <div style={{ lineHeight: 1.75, fontStyle: "italic" }}>{p}</div>
                </div>
              );
            }
            return (
              <div key={pi} style={{ lineHeight: 1.82, marginBottom: "0.9rem" }}>{p}</div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---- PRACTICE CONFIG ----
// This is the one thing that changes between practice deployments. Every
// practice runs an identical fork of this file and the system prompt —
// intake fields, interpretive logic, token budget, none of it varies by
// practice. The only per-deployment edit is the practice's own name below,
// which is what "swap one file, five minutes" actually means in practice:
// one constant, not a branching config system. No logo, color, or copy
// customization beyond this is currently supported by design — see the
// earlier decision to keep the product identical across every practice
// rather than build per-practice customization into the template itself.
const BRAND_CONFIG = {
  name: "Voltage Wellness",
};

function Header({ onClear }) {
  return (
    <div id="app-header" style={{ position: "fixed", top: 0, left: 0, right: 0, borderBottom: `1px solid ${c.border}`, padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: c.bgHeader, zIndex: 50 }}>
      <div>
        <div style={{ fontSize: "19px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS }}>{BRAND_CONFIG.name}</div>
        <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: c.accent, marginTop: "2px", fontFamily: SANS, fontWeight: 600 }}>Energetic Root Cause</div>
      </div>
      {onClear && (
        <button
          onClick={() => {
            if (window.confirm("Start a new reading? This clears your current reading and requires a new $5 payment — it doesn't carry over.")) {
              onClear();
            }
          }}
          style={{ background: "transparent", border: `1px solid ${c.borderMid}`, borderRadius: "6px", padding: "7px 14px", cursor: "pointer", color: c.textMuted, fontSize: "12px", fontFamily: SANS, fontWeight: 600, letterSpacing: "0.02em" }}
        >
          Start Over
        </button>
      )}
    </div>
  );
}

function Disclaimer() {
  return (
    <div style={{ textAlign: "center", fontSize: "11px", color: c.textMuted, marginTop: "0.75rem", letterSpacing: "0.03em", fontFamily: SANS }}>
      Energetic root cause interpretation — not a substitute for medical care. If you're managing a diagnosis, keep working with your doctor.
    </div>
  );
}

// ---- REGION CONFIG ----
// Carried over unchanged from the consumer app's per-body-part form logic —
// this mapping of which regions get side/plane distinctions, and which
// quality-of-sensation options apply, doesn't change just because the
// intake is now single-page instead of step-by-step.

const REGION_OPTIONS = [
  "Head", "Neck", "Throat", "Mouth", "Shoulders", "Chest", "Heart",
  "Upper Back", "Lower Back", "Abdomen", "Gut", "Hips", "Pelvis",
  "Legs", "Knees", "Ankles", "Feet", "Arms", "Hands", "Skin", "Somewhere else",
];

const REGION_DISPLAY = {
  "Head": "head", "Neck": "neck", "Throat": "throat", "Mouth": "mouth", "Shoulders": "shoulder",
  "Chest": "chest", "Heart": "heart", "Upper Back": "upper back", "Lower Back": "lower back",
  "Abdomen": "abdomen", "Gut": "gut", "Hips": "hip", "Pelvis": "pelvis",
  "Legs": "leg", "Knees": "knee", "Ankles": "ankle", "Feet": "foot",
  "Arms": "arm", "Hands": "hand", "Skin": "skin", "Somewhere else": "the area noted",
};

const REGION_GROUP_CONFIG = {
  "Head": { side: true, plane: true, centered: true },
  "Neck": { side: true, plane: true, centered: true },
  "Throat": { side: false, plane: false, centered: false },
  "Mouth": { side: false, plane: false, centered: false },
  "Shoulders": { side: true, plane: true, centered: false },
  "Chest": { side: true, plane: false, centered: true },
  "Heart": { side: false, plane: false, centered: false },
  "Upper Back": { side: true, plane: false, centered: true },
  "Lower Back": { side: true, plane: false, centered: true },
  "Abdomen": { side: true, plane: false, centered: true },
  "Gut": { side: false, plane: false, centered: false },
  "Hips": { side: true, plane: true, centered: false },
  "Pelvis": { side: true, plane: false, centered: true },
  "Legs": { side: true, plane: true, centered: false },
  "Knees": { side: true, plane: true, centered: false },
  "Ankles": { side: true, plane: false, centered: false },
  "Feet": { side: true, plane: false, centered: false },
  "Arms": { side: true, plane: false, centered: false },
  "Hands": { side: true, plane: false, centered: false },
  "Skin": { side: false, plane: false, centered: false },
  "Somewhere else": { side: false, plane: false, centered: false },
};

const QUALITY_OPTIONS_DEFAULT = ["Sharp", "Dull ache", "Sore", "Burning", "Tight", "Stiff", "Throbbing", "Numb", "Cramping", "Tingling", "Swollen", "Bloating", "Pressure", "Heavy", "Weak"];
const QUALITY_OPTIONS_BY_REGION = {
  "Skin": ["Itchy", "Dry", "Flaky", "Rash", "Burning", "Tingling", "Tight", "Breakouts", "Redness", "Numb"],
};

function regionDisplayName(region) {
  return REGION_DISPLAY[region] || region.toLowerCase();
}

let uidCounter = 0;
function nextId() {
  uidCounter += 1;
  return `id_${Date.now()}_${uidCounter}`;
}

// ---- DIAGNOSES: repeatable field ----

function DiagnosesSection({ diagnoses, updateDiagnosis, addDiagnosis, removeDiagnosis, toggleDiagnosisDetail }) {
  return (
    <div style={{ background: c.bgInput, border: `1.5px solid ${c.borderMid}`, borderRadius: "12px", padding: "24px 26px", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: c.accent, marginBottom: "1rem", fontFamily: SANS }}>
        Diagnoses
      </div>
      {diagnoses.map((d, i) => (
        <div key={d.id} style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              value={d.name}
              onChange={e => updateDiagnosis(d.id, "name", e.target.value)}
              placeholder="Diagnosis name"
              style={{ flex: "1 1 auto", minWidth: 0, background: c.bg, border: `1px solid ${c.borderMid}`, borderRadius: "8px", padding: "10px 12px", fontSize: "15px", fontFamily: SERIF, color: c.textPrimary }}
            />
            {!d.showDetail && (
              <button
                onClick={() => toggleDiagnosisDetail(d.id)}
                aria-label="Add detail"
                title="Add detail"
                style={{ flexShrink: 0, background: "transparent", border: `1px solid ${c.borderMid}`, borderRadius: "6px", width: "36px", height: "38px", cursor: "pointer", color: c.textMuted, fontSize: "16px", fontFamily: SANS, lineHeight: 1 }}
              >
                +
              </button>
            )}
            <button
              onClick={() => removeDiagnosis(d.id)}
              aria-label="Remove diagnosis"
              style={{ flexShrink: 0, background: "transparent", border: `1px solid ${c.borderMid}`, borderRadius: "6px", width: "36px", height: "38px", cursor: "pointer", color: c.textMuted, fontSize: "13px", fontFamily: SANS }}
            >
              ✕
            </button>
          </div>
          {d.showDetail && (
            <input
              value={d.detail}
              onChange={e => updateDiagnosis(d.id, "detail", e.target.value)}
              placeholder="Detail — how long, how it's progressed, etc. (optional)"
              style={{ width: "100%", boxSizing: "border-box", background: c.bg, border: `1px solid ${c.borderMid}`, borderRadius: "8px", padding: "10px 12px", fontSize: "15px", fontFamily: SERIF, color: c.textPrimary, marginTop: "8px" }}
            />
          )}
        </div>
      ))}
      <button
        onClick={addDiagnosis}
        style={{ background: "transparent", border: `1px dashed ${c.borderMid}`, borderRadius: "8px", padding: "9px 16px", cursor: "pointer", color: c.accent, fontSize: "13px", fontFamily: SANS, fontWeight: 600, marginTop: "4px" }}
      >
        + Add diagnosis
      </button>
    </div>
  );
}

// ---- SYMPTOMS: one block per added region, all visible on the same page ----

function RegionBlock({ entry, updateRegionOption, updateRegionDetail, removeRegion }) {
  const config = REGION_GROUP_CONFIG[entry.region] || { side: true, plane: true };
  const qualityOptions = QUALITY_OPTIONS_BY_REGION[entry.region] || QUALITY_OPTIONS_DEFAULT;
  const display = regionDisplayName(entry.region);

  const sideOptions = config.side ? (config.centered ? ["Left", "Right", "Centered"] : ["Left", "Right"]) : null;
  const bothSides = config.side && (entry.side || []).includes("Left") && (entry.side || []).includes("Right");

  const renderGroup = (label, key, options) => (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: c.textPrimary, marginBottom: "0.5rem", fontFamily: SANS }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map(opt => {
          const selected = (entry[key] || []).includes(opt);
          return (
            <button
              key={opt}
              onClick={() => updateRegionOption(entry.id, key, opt)}
              style={{
                background: selected ? c.accent : c.bg,
                border: `1.5px solid ${selected ? c.accent : c.borderMid}`,
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "14px",
                color: selected ? "#fff" : c.textPrimary,
                cursor: "pointer",
                fontFamily: SERIF,
                fontWeight: selected ? 600 : 400,
              }}
            >
              {selected ? "✓ " : ""}{opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ background: c.bg, border: `1.5px solid ${c.borderMid}`, borderRadius: "12px", padding: "20px 22px", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS, textTransform: "capitalize" }}>{display}</div>
        <button
          onClick={() => removeRegion(entry.id)}
          style={{ background: "transparent", border: `1px solid ${c.borderMid}`, borderRadius: "6px", padding: "6px 10px", cursor: "pointer", color: c.textMuted, fontSize: "12px", fontFamily: SANS }}
        >
          Remove
        </button>
      </div>

      {sideOptions && renderGroup("Side", "side", sideOptions)}

      {bothSides ? (
        <>
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: c.accent, margin: "0.75rem 0 0.5rem" }}>Left {display}</div>
          {config.plane && renderGroup("Front / back", "left_plane", ["Front", "Back"])}
          {renderGroup("Sensation", "left_quality", qualityOptions)}
          {renderGroup("Pattern", "left_pattern", ["First time", "Comes and goes", "Constant / ongoing"])}
          <textarea
            value={entry.left_detail || ""}
            onChange={e => updateRegionDetail(entry.id, "left_detail", e.target.value)}
            placeholder={`Additional detail on the left ${display} (optional)`}
            rows={2}
            style={{ width: "100%", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", fontFamily: SERIF, color: c.textPrimary, marginBottom: "1rem", resize: "vertical" }}
          />
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: c.accent, margin: "0.75rem 0 0.5rem" }}>Right {display}</div>
          {config.plane && renderGroup("Front / back", "right_plane", ["Front", "Back"])}
          {renderGroup("Sensation", "right_quality", qualityOptions)}
          {renderGroup("Pattern", "right_pattern", ["First time", "Comes and goes", "Constant / ongoing"])}
          <textarea
            value={entry.right_detail || ""}
            onChange={e => updateRegionDetail(entry.id, "right_detail", e.target.value)}
            placeholder={`Additional detail on the right ${display} (optional)`}
            rows={2}
            style={{ width: "100%", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", fontFamily: SERIF, color: c.textPrimary, resize: "vertical" }}
          />
        </>
      ) : (
        <>
          {config.plane && renderGroup("Front / back", "plane", ["Front", "Back"])}
          {renderGroup("Sensation", "quality", qualityOptions)}
          {renderGroup("Pattern", "pattern", ["First time", "Comes and goes", "Constant / ongoing"])}
          <textarea
            value={entry.detail || ""}
            onChange={e => updateRegionDetail(entry.id, "detail", e.target.value)}
            placeholder="Additional detail — onset, what makes it better or worse, etc. (optional)"
            rows={2}
            style={{ width: "100%", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "8px", padding: "10px 12px", fontSize: "14px", fontFamily: SERIF, color: c.textPrimary, resize: "vertical" }}
          />
        </>
      )}
    </div>
  );
}

function SymptomsSection({ regions, addRegion, updateRegionOption, updateRegionDetail, removeRegion }) {
  const [picking, setPicking] = useState(false);
  const usedRegions = new Set(regions.map(r => r.region));

  return (
    <div style={{ background: c.bgInput, border: `1.5px solid ${c.borderMid}`, borderRadius: "12px", padding: "24px 26px", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: c.accent, marginBottom: "1rem", fontFamily: SANS }}>
        Symptoms by Region
      </div>

      {regions.map(entry => (
        <RegionBlock
          key={entry.id}
          entry={entry}
          updateRegionOption={updateRegionOption}
          updateRegionDetail={updateRegionDetail}
          removeRegion={removeRegion}
        />
      ))}

      {picking ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "0.5rem" }}>
          {REGION_OPTIONS.filter(r => !usedRegions.has(r)).map(r => (
            <button
              key={r}
              onClick={() => { addRegion(r); setPicking(false); }}
              style={{ background: c.bg, border: `1.5px solid ${c.borderMid}`, borderRadius: "8px", padding: "8px 14px", fontSize: "14px", color: c.textPrimary, cursor: "pointer", fontFamily: SERIF }}
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => setPicking(false)}
            style={{ background: "transparent", border: "none", color: c.textMuted, fontSize: "13px", fontFamily: SANS, cursor: "pointer", padding: "8px 4px" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setPicking(true)}
          style={{ background: "transparent", border: `1px dashed ${c.borderMid}`, borderRadius: "8px", padding: "9px 16px", cursor: "pointer", color: c.accent, fontSize: "13px", fontFamily: SANS, fontWeight: 600 }}
        >
          + Add region
        </button>
      )}
    </div>
  );
}

function LifeContextSection({ lifeContext, setLifeContext }) {
  return (
    <div style={{ background: c.bgInput, border: `1.5px solid ${c.borderMid}`, borderRadius: "12px", padding: "24px 26px", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: c.accent, marginBottom: "0.5rem", fontFamily: SANS }}>
        Life Context (optional)
      </div>
      <div style={{ fontSize: "13px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic", marginBottom: "0.75rem" }}>
        Anything worth carrying into your reading — timing, relationships, major transitions, in your own words.
      </div>
      <textarea
        value={lifeContext}
        onChange={e => setLifeContext(e.target.value)}
        placeholder="Type here..."
        rows={4}
        style={{ width: "100%", background: c.bg, border: `1px solid ${c.borderMid}`, borderRadius: "8px", padding: "12px 14px", fontSize: "15px", fontFamily: SERIF, color: c.textPrimary, resize: "vertical" }}
      />
    </div>
  );
}

// ---- COMPILE INTAKE INTO THE TEXT SENT TO THE MODEL ----

function formatRegionEntry(entry) {
  const display = regionDisplayName(entry.region);
  const parts = [];
  const bothSides = (entry.side || []).includes("Left") && (entry.side || []).includes("Right");

  if (entry.side && entry.side.length) parts.push(`Side: ${entry.side.join(", ")}`);

  if (bothSides) {
    const sideParts = (prefix, label) => {
      const p = [];
      if (entry[`${prefix}_plane`]?.length) p.push(`Front/back: ${entry[`${prefix}_plane`].join(", ")}`);
      if (entry[`${prefix}_quality`]?.length) p.push(`Sensation: ${entry[`${prefix}_quality`].join(", ")}`);
      if (entry[`${prefix}_pattern`]?.length) p.push(`Pattern: ${entry[`${prefix}_pattern`].join(", ")}`);
      if (entry[`${prefix}_detail`]?.trim()) p.push(`Detail: ${entry[`${prefix}_detail`].trim()}`);
      if (p.length) parts.push(`${label} — ${p.join(" | ")}`);
    };
    sideParts("left", "Left side");
    sideParts("right", "Right side");
  } else {
    if (entry.plane && entry.plane.length) parts.push(`Front/back: ${entry.plane.join(", ")}`);
    if (entry.quality && entry.quality.length) parts.push(`Sensation: ${entry.quality.join(", ")}`);
    if (entry.pattern && entry.pattern.length) parts.push(`Pattern: ${entry.pattern.join(", ")}`);
    if (entry.detail && entry.detail.trim()) parts.push(`Detail: ${entry.detail.trim()}`);
  }

  return `Regarding your ${display}:\n${parts.length ? parts.join(" | ") : "(no further detail provided)"}`;
}

function compilePanelIntake(diagnoses, regions, lifeContext) {
  const sections = [];

  const namedDiagnoses = diagnoses.filter(d => d.name.trim());
  if (namedDiagnoses.length) {
    sections.push(
      "Diagnoses reported for this patient:\n" +
      namedDiagnoses.map(d => `- ${d.name.trim()}${d.detail.trim() ? ` — ${d.detail.trim()}` : ""}`).join("\n")
    );
  }

  if (regions.length) {
    sections.push(regions.map(formatRegionEntry).join("\n\n"));
  }

  if (lifeContext.trim()) {
    sections.push(`Life context:\n${lifeContext.trim()}`);
  }

  return sections.join("\n\n");
}

// Token budget for panel generation.
//
// This matches the panel's current structure: one entry per diagnosis, one
// entry per reported symptom/region, nothing else. There's no fixed section
// count to work against anymore (no seven-chakra ceiling, no floor cost for
// unreported material) — a patient with two things reported gets a two-
// entry panel, a patient with six things reported gets a six-entry panel,
// and every entry gets the same flat, full-depth treatment regardless of
// order. That makes the estimate simpler than it was under the chakra-
// organized structure: entry count is no longer a proxy for something else,
// it's the actual, exact number of entries the panel will contain.
//
// Since only actual generated tokens are billed, erring generous on the
// ceiling costs nothing and protects a genuinely complex intake (many
// diagnoses and regions at once) from getting cut off mid-entry.
function estimateEntryCount(diagnoses, regions) {
  const diagnosisCount = diagnoses.filter(d => d.name.trim()).length;
  const regionCount = regions.length;
  return Math.max(1, diagnosisCount + regionCount);
}

function tokensForPanel(diagnoses, regions) {
  const entryCount = estimateEntryCount(diagnoses, regions);

  // Opening framing plus whatever brief connective material ties entries
  // together, if a real connection between them is actually noted.
  const BASE_OVERHEAD = 400;
  // Per entry: real, substantive, clinically direct paragraphs plus a
  // folded-in guiding question. Raised from 2800 after a real truncation —
  // a complex, multi-layered condition (Ehlers-Danlos Syndrome, in the case
  // that surfaced this) can legitimately earn more than a typical entry.
  // This number isn't the actual fix for truncation — callAPIWithContinuation
  // is — but a higher budget means fewer entries need to fall back on a
  // continuation round-trip at all, which is faster for whoever's waiting
  // on the response.
  const TOKENS_PER_ENTRY = 3800;
  // Safety ceiling — no natural cap on entry count anymore (unlike the old
  // seven-chakra structure), so this exists purely as a backstop against an
  // unusually large intake, not a value normal use should approach.
  const CEILING = 38000;

  return Math.min(BASE_OVERHEAD + entryCount * TOKENS_PER_ENTRY, CEILING);
}

// ---- MAIN INTAKE SCREEN ----

function PanelIntakeForm({ diagnoses, regions, lifeContext, loading, checkoutLoading, paymentError,
  addDiagnosis, updateDiagnosis, removeDiagnosis, toggleDiagnosisDetail,
  addRegion, updateRegionOption, updateRegionDetail, removeRegion,
  setLifeContext, submitIntake }) {

  const hasAnyInput = diagnoses.some(d => d.name.trim()) || regions.length > 0;
  const busy = loading || !!checkoutLoading;

  return (
    <div style={{ width: "100%", maxWidth: "760px", margin: "1.75rem auto", padding: "0 1.5rem", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "28px", fontWeight: 800, color: c.textPrimary, fontFamily: SANS, letterSpacing: "-0.02em" }}>
          Energetic Root Cause
        </div>
        <div style={{ fontSize: "15px", color: c.textSecondary, fontFamily: SERIF, marginTop: "0.5rem" }}>
          Enter what's going on for you. All fields are optional except at least one diagnosis or region.
        </div>
      </div>

      <DiagnosesSection diagnoses={diagnoses} updateDiagnosis={updateDiagnosis} addDiagnosis={addDiagnosis} removeDiagnosis={removeDiagnosis} toggleDiagnosisDetail={toggleDiagnosisDetail} />
      <SymptomsSection regions={regions} addRegion={addRegion} updateRegionOption={updateRegionOption} updateRegionDetail={updateRegionDetail} removeRegion={removeRegion} />
      <LifeContextSection lifeContext={lifeContext} setLifeContext={setLifeContext} />

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        {!hasAnyInput && (
          <div style={{ fontSize: "13px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic", marginBottom: "0.75rem" }}>
            Add at least one diagnosis or region before generating your reading.
          </div>
        )}
        {paymentError && (
          <div style={{ fontSize: "13px", color: "#a13d3d", fontFamily: SANS, marginBottom: "0.75rem", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
            {paymentError}
          </div>
        )}
        <button
          onClick={submitIntake}
          disabled={busy || !hasAnyInput}
          style={{
            background: (busy || !hasAnyInput) ? c.accentMid : c.accent,
            border: "none", borderRadius: "8px", padding: "14px 32px",
            cursor: (busy || !hasAnyInput) ? "default" : "pointer",
            color: (busy || !hasAnyInput) ? c.textMuted : "#fff",
            fontSize: "15px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.03em",
          }}
        >
          {checkoutLoading ? "Redirecting to payment…" : loading ? "Generating…" : SKIP_PAYMENT ? "Generate Reading" : "Generate Reading — $5"}
        </button>
        <div style={{ fontSize: "11px", color: c.textMuted, fontFamily: SANS, marginTop: "0.6rem" }}>
          {SKIP_PAYMENT
            ? "Includes up to 4 follow-up messages in the conversation afterward."
            : "One-time $5 for your reading, which includes up to 4 follow-up messages in the conversation afterward."}
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}

// ---- SIMPLE CHAT INPUT (unchanged from consumer app, for the follow-up conversation) ----

function SimpleChatInput({ value, onChange, onSubmit, placeholder, loading, handleTextKeyDown, sendLabel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "10px", padding: "10px 14px" }}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleTextKeyDown(onSubmit)}
        placeholder={placeholder}
        rows={2}
        autoFocus
        style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "18px", fontFamily: SERIF, lineHeight: 1.6, resize: "none", width: "100%" }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onSubmit}
          disabled={!value.trim() || loading}
          style={{ background: value.trim() && !loading ? c.accent : c.accentMid, border: "none", borderRadius: "4px", padding: "7px 18px", cursor: value.trim() && !loading ? "pointer" : "default", color: value.trim() && !loading ? "#fff" : c.textMuted, fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em" }}
        >
          {sendLabel || "Send \u2192"}
        </button>
      </div>
    </div>
  );
}

// ---- TRANSCRIPT ----
// No donation note, no accuracy-reassurance note. These existed in the
// original consumer app and would arguably make sense again now that the
// reader is back to being an individual — but they're deliberately not
// reintroduced here, since the scope of this version was voice and user
// only, not restoring every feature the practitioner version stripped.
// Worth a deliberate call from Zach on whether either belongs back in,
// same as the persistence question above.

function Transcript({ messages, loading, messagesEndRef, lastMessageRef, scrollContainerRef, ctaSlot, loadingLabel, copyReadingText, downloadReadingText, copiedIndex }) {
  let lastRealIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!messages[i].hidden && !messages[i].localOnly) { lastRealIndex = i; break; }
  }
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", maxWidth: "700px", width: "100%", margin: "0 auto" }}>
      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: "auto", padding: "0 1.5rem" }}>
        <div style={{ paddingTop: "2rem" }}>
          {messages.map((msg, i) => msg.hidden ? null : (
            <div key={i} ref={i === lastRealIndex ? lastMessageRef : null} style={{ marginBottom: "2rem" }}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: c.userBubble, border: `1px solid ${c.userBubbleBorder}`, borderRadius: "14px 14px 2px 14px", padding: "12px 18px", maxWidth: "85%", fontSize: "15px", lineHeight: 1.65, color: c.textSecondary, whiteSpace: "pre-wrap", fontFamily: SERIF }}>
                    {msg.display || msg.content}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: c.accentLight, border: `1px solid ${c.borderMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: c.accent, flexShrink: 0, marginTop: "2px", fontFamily: SANS }}>&#10022;</div>
                    <div style={{ flex: 1, fontSize: "17px", color: c.textPrimary, fontFamily: SERIF }}>{formatMessage(msg.content)}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "0.9rem", marginLeft: "40px" }}>
                    <button onClick={() => copyReadingText(msg.content, i)} style={{ background: "transparent", border: `1px solid ${c.borderMid}`, borderRadius: "6px", padding: "6px 14px", fontFamily: SANS, fontSize: "12px", fontWeight: 600, color: c.textSecondary, cursor: "pointer", letterSpacing: "0.02em" }}>
                      {copiedIndex === i ? "Copied ✓" : "Copy"}
                    </button>
                    <button onClick={() => downloadReadingText(msg.content, msg.readingLabel || "reading")} style={{ background: "transparent", border: `1px solid ${c.borderMid}`, borderRadius: "6px", padding: "6px 14px", fontFamily: SANS, fontSize: "12px", fontWeight: 600, color: c.textSecondary, cursor: "pointer", letterSpacing: "0.02em" }}>
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "2rem" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: c.accentLight, border: `1px solid ${c.borderMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: c.accent, flexShrink: 0 }}>&#10022;</div>
              <div style={{ paddingTop: "6px" }}>
                {loadingLabel && <div style={{ fontSize: "13px", color: c.textMuted, fontFamily: SANS, marginBottom: "6px" }}>{loadingLabel}</div>}
                <div style={{ display: "flex", gap: "5px" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.accent, animation: `panel-pulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.45 }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} style={{ paddingBottom: "1rem" }} />
        </div>
      </div>
      {ctaSlot && (
        <div style={{ flexShrink: 0, background: c.bg, borderTop: `1px solid ${c.border}`, padding: "1rem 1.5rem 1.25rem" }}>
          {ctaSlot}
        </div>
      )}
    </div>
  );
}

// ---- MAIN COMPONENT ----

// localStorage keys. Persistence is new here — it wasn't part of the
// Panel (deliberately, for cross-patient-risk reasons) and was left off
// in the first version of this file pending a deliberate call. Payment
// changes that calculus: losing a paid reading on refresh is a real
// problem once real money is involved, not just an inconvenience. It's
// also structurally required now — completing a Stripe Checkout is a full
// page navigation away from the app and back, so anything that needs to
// survive that trip (the reading in progress, whether it's been paid for)
// has to live somewhere other than React state.
const SESSION_KEY = "erc_reading_session";
const PENDING_INTAKE_KEY = "erc_reading_pending_intake";
// How many follow-up exchanges (one user message + one response) are
// included in the flat $5 price before the conversation stops accepting
// new messages. This is a usage cap on an already-paid feature, not a
// second paywall — there's no monetary incentive to game it client-side,
// so counting it in the browser (rather than tracking it server-side the
// way payment itself is verified) is a reasonable place to draw the line.
const INCLUDED_FOLLOWUPS = 4;

// TEMPORARY TOGGLE: while true, submitIntake skips Stripe entirely and
// generates the reading directly — for testing without paying. Nothing
// about the Stripe integration is removed or disabled underneath this;
// create-checkout-session.js, verify-payment.js, and startCheckout below
// are all still fully intact. Flip this back to false (or delete the
// block that checks it in submitIntake) to require payment again — that's
// the only thing this flag touches.
const SKIP_PAYMENT = true;

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PENDING_INTAKE_KEY);
  } catch {}
}

export default function ReadingInterpreter() {
  const restored = loadSession();

  const [messages, setMessages] = useState(restored?.messages || []);
  const [loading, setLoading] = useState(false);
  // step: 'intake' (the single-page form) -> 'chat' (reading result, then
  // up to INCLUDED_FOLLOWUPS more exchanges).
  const [step, setStep] = useState(restored?.step || "intake");
  // hasPaid: whether the one-time $5 has been confirmed. There's only one
  // paid tier now — the $5 covers the reading and the included follow-ups
  // together, so this is a simple boolean rather than a tier string. See
  // the payment verification effect below for how it gets set, and
  // verify-payment.js for how it's checked server-side rather than just
  // trusted from the browser.
  const [hasPaid, setHasPaid] = useState(!!restored?.hasPaid);
  // Tracks an in-flight redirect to Stripe so the button can show a
  // loading state and can't be double-clicked into two checkout sessions.
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  // True from the very first render whenever the URL shows a return trip
  // from Stripe, computed synchronously (not in an effect) specifically so
  // there's no gap where the empty intake form could flash before the
  // payment-verification effect has had a chance to run. Set back to false
  // once that effect finishes, one way or another.
  const [confirmingPayment, setConfirmingPayment] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return !!(params.get("paid") && params.get("session_id"));
    } catch {
      return false;
    }
  });
  const [paymentError, setPaymentError] = useState(null);

  const [diagnoses, setDiagnoses] = useState([]);
  const [regions, setRegions] = useState([]);
  const [lifeContext, setLifeContext] = useState("");
  const [chatDraft, setChatDraft] = useState("");

  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Keep the persisted session in sync with the state that actually needs
  // to survive a refresh or a round trip to Stripe. Intake fields (before
  // a reading exists) deliberately aren't included here — only the
  // pending-intake stash right before a Stripe redirect needs those, and
  // that's handled separately in submitIntake.
  useEffect(() => {
    if (step === "chat" || hasPaid) {
      saveSession({ messages, step, hasPaid });
    }
  }, [messages, step, hasPaid]);

  // Handles returning from Stripe. Runs once on mount, before anything
  // else needs to know whether a payment just completed.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidParam = params.get("paid");
    const sessionId = params.get("session_id");
    const canceledParam = params.get("canceled");

    if (canceledParam) {
      window.history.replaceState({}, "", window.location.pathname);
      setConfirmingPayment(false);
      return;
    }

    if (!paidParam || !sessionId) {
      setConfirmingPayment(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();

        if (!data.paid || data.tier !== "initial") {
          setPaymentError("We couldn't confirm that payment went through. If you were charged, contact support before trying again.");
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }

        window.history.replaceState({}, "", window.location.pathname);

        setHasPaid(true);
        let pendingIntake = null;
        try {
          const raw = localStorage.getItem(PENDING_INTAKE_KEY);
          pendingIntake = raw ? JSON.parse(raw) : null;
        } catch {}
        try { localStorage.removeItem(PENDING_INTAKE_KEY); } catch {}

        if (pendingIntake) {
          setDiagnoses(pendingIntake.diagnoses || []);
          setRegions(pendingIntake.regions || []);
          setLifeContext(pendingIntake.lifeContext || "");
          // generateReadingFromIntake sets its own loading state and,
          // on success, flips step to 'chat' — confirmingPayment being
          // cleared in the finally block below is what stops the
          // confirmation screen from covering that transition.
          await generateReadingFromIntake(pendingIntake.diagnoses || [], pendingIntake.regions || [], pendingIntake.lifeContext || "");
        } else {
          setPaymentError("Payment was confirmed, but your intake details weren't found on this device. Please fill out the form again — you won't be charged twice for the same payment; contact support if you need a refund reconciled.");
        }
      } catch (err) {
        setPaymentError("Something went wrong confirming payment. If you were charged, contact support.");
        window.history.replaceState({}, "", window.location.pathname);
      } finally {
        setConfirmingPayment(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const reset = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } catch {}
      ensureHeaderVisible();
    };
    reset();
    const raf = requestAnimationFrame(reset);
    const timers = [30, 60, 100, 200, 350, 500].map(delay => setTimeout(reset, delay));
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, [step, messages.length]);

  const copyReadingText = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(prev => (prev === index ? null : prev)), 2000);
    }).catch(() => {});
  };

  const downloadReadingText = (text, label) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = (label || "panel").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".txt";
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  async function callAPI(newMessages, maxTokens) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: maxTokens || 6000,
        system: SYSTEM_PROMPT,
        messages: newMessages.filter(m => !m.localOnly).map(({ role, content }) => ({ role, content })),
      }),
    });
    const data = await response.json();
    return {
      text: data.content?.find(b => b.type === "text")?.text || "Something went wrong. Please try again.",
      stopReason: data.stop_reason || null,
    };
  }

  // A response that hits the token ceiling comes back as a normal, successful
  // API call — stop_reason: "max_tokens" instead of "end_turn" — not an
  // error. Left unhandled, that means a reading can end mid-sentence with
  // nothing telling the user, or the code, that anything went wrong; the
  // partial text just gets displayed as if it were the complete reading.
  // This wraps callAPI so that never reaches the screen: if a response comes
  // back truncated, it automatically asks the model to continue exactly
  // where it left off and stitches the result together, capped at a few
  // rounds as a backstop against a pathological case that never finishes.
  async function callAPIWithContinuation(messages, maxTokens) {
    let combinedText = "";
    let currentMessages = messages;
    const maxRounds = 3;

    for (let round = 0; round < maxRounds; round++) {
      const { text, stopReason } = await callAPI(currentMessages, maxTokens);
      combinedText += text;

      if (stopReason !== "max_tokens") break;

      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: combinedText },
        { role: "user", content: "Continue exactly where you left off. Do not repeat anything already written, do not restate or re-summarize what's already been said, and do not add any preamble — just continue the sentence or thought directly." },
      ];
    }

    return combinedText;
  }

  // ---- DIAGNOSES HANDLERS ----
  const addDiagnosis = () => setDiagnoses(prev => [...prev, { id: nextId(), name: "", detail: "", showDetail: false }]);
  const updateDiagnosis = (id, field, value) => setDiagnoses(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  const removeDiagnosis = (id) => setDiagnoses(prev => prev.filter(d => d.id !== id));
  const toggleDiagnosisDetail = (id) => setDiagnoses(prev => prev.map(d => d.id === id ? { ...d, showDetail: !d.showDetail } : d));

  // ---- REGIONS HANDLERS ----
  const addRegion = (region) => setRegions(prev => [...prev, { id: nextId(), region }]);
  const removeRegion = (id) => setRegions(prev => prev.filter(r => r.id !== id));
  const updateRegionOption = (id, key, option) => setRegions(prev => prev.map(r => {
    if (r.id !== id) return r;
    const current = r[key] || [];
    const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
    return { ...r, [key]: next };
  }));
  const updateRegionDetail = (id, key, value) => setRegions(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r));

  // ---- SUBMIT INTAKE -> GENERATE PANEL ----
  // Generates the actual reading. Only ever called after payment for the
  // 'initial' tier has been verified — see the mount effect above, which
  // calls this once someone returns from Stripe with a confirmed payment
  // and their stashed intake. Takes its arguments explicitly rather than
  // reading from state, since it's called from that effect with data just
  // pulled out of localStorage, not necessarily whatever's currently in
  // the diagnoses/regions/lifeContext state at that exact render.
  async function generateReadingFromIntake(diagnosesArg, regionsArg, lifeContextArg) {
    setLoading(true);
    const compiled = compilePanelIntake(diagnosesArg, regionsArg, lifeContextArg);
    const userMsg = {
      role: "user",
      content: `Here is my intake:\n\n${compiled}\n\nGenerate my full Energetic Root Cause Reading based on this.`,
      display: compiled,
      hidden: true,
    };
    const newMessages = [userMsg];
    setMessages(newMessages);
    try {
      const text = await callAPIWithContinuation(newMessages, tokensForPanel(diagnosesArg, regionsArg));
      setMessages([...newMessages, { role: "assistant", content: text, isReading: true, readingLabel: "Energetic Root Cause Reading" }]);
      setStep("chat");
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "There was a connection error. Please try again." }]);
    }
    setLoading(false);
  }

  // Redirects to Stripe Checkout for the one-time $5 reading. Stashes the
  // current intake first, since that's the data generateReadingFromIntake
  // needs after the round trip back from Stripe.
  const startCheckout = async () => {
    if (checkoutLoading) return;
    setPaymentError(null);
    setCheckoutLoading(true);

    try {
      localStorage.setItem(PENDING_INTAKE_KEY, JSON.stringify({ diagnoses, regions, lifeContext }));
    } catch {}

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "initial" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPaymentError(data.error || "Couldn't start checkout. Please try again.");
        setCheckoutLoading(false);
      }
    } catch (err) {
      setPaymentError("Couldn't reach the payment system. Please try again.");
      setCheckoutLoading(false);
    }
  };

  const submitIntake = () => {
    const hasAnyInput = diagnoses.some(d => d.name.trim()) || regions.length > 0;
    if (!hasAnyInput || loading || checkoutLoading) return;
    if (SKIP_PAYMENT) {
      setHasPaid(true);
      generateReadingFromIntake(diagnoses, regions, lifeContext);
    } else {
      startCheckout();
    }
  };

  const sendChatMessage = async (userMsg) => {
    const newMessages = [...messages, userMsg];
    setLoading(true);
    setMessages(newMessages);
    try {
      const text = await callAPIWithContinuation(newMessages, 8000);
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "There was a connection error. Please try again." }]);
    }
    setLoading(false);
  };

  // Follow-up messages sent so far, not counting the hidden intake message
  // that kicked off the original reading. Compared against
  // INCLUDED_FOLLOWUPS to decide whether the chat input is still available.
  const followUpCount = messages.filter(m => m.role === "user" && !m.hidden).length;

  const submitChatMessage = () => {
    // Defensive only — the chat input itself is replaced by a "you've used
    // your included follow-ups" message once the cap is hit (see the chat
    // render below), so this shouldn't normally be reachable past the cap.
    if (followUpCount >= INCLUDED_FOLLOWUPS) return;
    const trimmed = chatDraft.trim();
    if (!trimmed || loading) return;
    setChatDraft("");
    sendChatMessage({ role: "user", content: trimmed, display: trimmed });
  };

  const handleTextKeyDown = (submitFn) => (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitFn(); }
  };

  const handleStartOver = () => {
    clearSession();
    setMessages([]);
    setStep("intake");
    setHasPaid(false);
    setPaymentError(null);
    setDiagnoses([]);
    setRegions([]);
    setLifeContext("");
    setChatDraft("");
  };


  // ---- RENDER: CONFIRMING PAYMENT ----
  // Takes priority over both other render branches. Covers the entire
  // window between landing back from Stripe and the reading being ready —
  // including the brief moment before the verification effect has even
  // run, since confirmingPayment is computed synchronously from the URL
  // at initial state, not set inside the effect itself.
  if (confirmingPayment) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column", paddingTop: "80px" }}>
        <Header onClear={null} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: c.accent, animation: `panel-pulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.45 }} />
            ))}
          </div>
          <div style={{ fontSize: "15px", color: c.textSecondary, fontFamily: SANS }}>Confirming your payment…</div>
        </div>
        <style>{`@keyframes panel-pulse { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.8; transform: scale(1); } } * { box-sizing: border-box; } body { margin: 0; }`}</style>
      </div>
    );
  }

  // ---- RENDER: INTAKE ----
  if (step === "intake" && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column", paddingTop: "80px" }}>
        <Header onClear={null} />
        <PanelIntakeForm
          diagnoses={diagnoses} regions={regions} lifeContext={lifeContext} loading={loading}
          checkoutLoading={checkoutLoading} paymentError={paymentError}
          addDiagnosis={addDiagnosis} updateDiagnosis={updateDiagnosis} removeDiagnosis={removeDiagnosis} toggleDiagnosisDetail={toggleDiagnosisDetail}
          addRegion={addRegion} updateRegionOption={updateRegionOption} updateRegionDetail={updateRegionDetail} removeRegion={removeRegion}
          setLifeContext={setLifeContext} submitIntake={submitIntake}
        />
        <style>{`* { box-sizing: border-box; overflow-anchor: none; } body { margin: 0; } textarea::placeholder, input::placeholder { color: rgba(30,26,22,0.3); }`}</style>
      </div>
    );
  }

  // ---- RENDER: READING RESULT + FOLLOW-UP CHAT ----
  // The chat input is available for up to INCLUDED_FOLLOWUPS exchanges,
  // included in the one $5 payment. Past that, it's replaced by a plain
  // message rather than letting someone type into a dead end.
  return (
    <div style={{ height: "100vh", overflow: "hidden", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column", paddingTop: "80px" }}>
      <Header onClear={handleStartOver} />
      <Transcript
        messages={messages} loading={loading} messagesEndRef={messagesEndRef} lastMessageRef={lastMessageRef}
        scrollContainerRef={scrollContainerRef} copyReadingText={copyReadingText} downloadReadingText={downloadReadingText} copiedIndex={copiedIndex}
        loadingLabel={loading && messages.length <= 1 ? "Generating your results…" : undefined}
        ctaSlot={
          <>
            {followUpCount < INCLUDED_FOLLOWUPS ? (
              <>
                <SimpleChatInput
                  value={chatDraft} onChange={setChatDraft} onSubmit={submitChatMessage}
                  placeholder="Ask a follow-up — go deeper on something, explore a connection, whatever's on your mind..."
                  loading={loading} handleTextKeyDown={handleTextKeyDown}
                />
                <div style={{ fontSize: "11px", color: c.textMuted, fontFamily: SANS, textAlign: "center", marginTop: "0.5rem" }}>
                  {INCLUDED_FOLLOWUPS - followUpCount} follow-up {INCLUDED_FOLLOWUPS - followUpCount === 1 ? "message" : "messages"} included with your reading.
                </div>
              </>
            ) : (
              <div style={{ background: c.accentLight, border: `1px solid ${c.accentMid}`, borderRadius: "10px", padding: "1.1rem 1.3rem", textAlign: "center" }}>
                <div style={{ fontSize: "15px", color: c.textPrimary, fontFamily: SERIF, lineHeight: 1.7 }}>
                  You've used all {INCLUDED_FOLLOWUPS} follow-up messages included with this reading.
                </div>
              </div>
            )}
            <Disclaimer />
          </>
        }
      />
      <style>{`
        @keyframes panel-pulse { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.8; transform: scale(1); } }
        textarea::placeholder, input::placeholder { color: rgba(30,26,22,0.3); }
        * { box-sizing: border-box; overflow-anchor: none; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
