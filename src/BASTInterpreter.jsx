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

function formatMessage(content) {
  // A per-turn conversational question, tagged by the model so it can be
  // visually set apart from the surrounding reflection.
  const qMatch = content.match(/\[\[Q\]\]([\s\S]*?)\[\[\/Q\]\]/i);
  const mainText = qMatch ? content.replace(qMatch[0], "").trim() : content;
  const questionText = qMatch ? qMatch[1].trim() : null;

  const parts = mainText.split(/(Guiding Question[:\s]*)/i);
  if (parts.length > 1) {
    return (
      <>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{parts[0]}</div>
        <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "rgba(193,127,58,0.08)", borderLeft: "3px solid #c17f3a", borderRadius: "0 8px 8px 0" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c17f3a", marginBottom: "0.4rem", fontFamily: SANS }}>
            Guiding Question
          </div>
          <div style={{ fontSize: "18px", fontStyle: "italic", lineHeight: 1.75, color: "#1e1a16", fontFamily: SERIF }}>
            {parts.slice(2).join("").trim()}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{mainText}</div>
      {questionText && (
        <div style={{ marginTop: "1.25rem", padding: "0.9rem 1.1rem", background: c.accentLight, borderLeft: `3px solid ${c.accent}`, borderRadius: "0 8px 8px 0" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: c.accent, marginBottom: "0.35rem", fontFamily: SANS }}>
            Question
          </div>
          <div style={{ fontSize: "17px", lineHeight: 1.65, color: c.textPrimary, fontFamily: SERIF }}>
            {questionText}
          </div>
        </div>
      )}
    </>
  );
}

// ---- SHARED HEADER (hoisted to module scope so it isn't recreated, and
// therefore remounted, on every keystroke of a parent-controlled input) ----

function Header({ messages, t1Index, clearHistory }) {
  return (
    <div style={{ borderBottom: `1px solid ${c.border}`, padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: c.bgHeader, position: "sticky", top: 0, zIndex: 10 }}>
      <div>
        <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "2px", fontFamily: SANS, fontWeight: 600 }}>Voltage Wellness</div>
        <div style={{ fontSize: "17px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS }}>Energetic Root Cause</div>
      </div>
      {(messages.length > 0 || t1Index > 0) && (
        <button onClick={clearHistory} style={{ background: "transparent", border: `1px solid ${c.borderMid}`, color: c.textMuted, padding: "6px 14px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontFamily: SANS, fontWeight: 500 }}>
          Start over
        </button>
      )}
    </div>
  );
}

function Disclaimer() {
  return (
    <div style={{ textAlign: "center", fontSize: "11px", color: c.textMuted, marginTop: "0.75rem", letterSpacing: "0.03em", fontFamily: SANS }}>
      Energetic root cause interpretation — not a substitute for medical care.
    </div>
  );
}

// ---- QUESTION WIZARD SCREEN (also hoisted — this is the one that was
// causing the reversed-typing bug in the free-text answers) ----

function QuestionScreen({ questions, index, tierLabel, loading, textDraft, setTextDraft, handleTextKeyDown, multiSelected, toggleMultiSelect1, submitT1Multi }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const q = questions[index];
  const needsSomewhereElseDetail = q.id === "region" && multiSelected.includes("Somewhere else");
  const detailLabel = needsSomewhereElseDetail
    ? "Where is this happening, specifically? (required)"
    : (q.detailLabel || "Anything else to add? (optional)");
  const blocked = (q.required && multiSelected.length === 0 && !textDraft.trim())
    || (needsSomewhereElseDetail && !textDraft.trim());

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "620px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "1rem", fontFamily: SANS }}>
            {tierLabel} · Question {index + 1} of {questions.length}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: c.textPrimary, marginBottom: "0.5rem", lineHeight: 1.3, fontFamily: SANS, letterSpacing: "-0.01em" }}>
            {q.q}
          </div>
          {q.hint && (
            <div style={{ fontSize: "14px", color: c.textMuted, lineHeight: 1.6, marginTop: "0.75rem", fontFamily: SERIF, fontStyle: "italic" }}>
              {q.hint}
            </div>
          )}
          {q.options.length > 0 && (
            <div style={{ fontSize: "12px", color: c.textMuted, marginTop: "0.5rem", fontFamily: SANS, fontStyle: "italic" }}>
              Select all that apply
            </div>
          )}
          {q.required && (
            <div style={{ fontSize: "12px", color: c.accentPop, marginTop: "0.5rem", fontFamily: SANS, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Required
            </div>
          )}
          {q.optional && (
            <div style={{ fontSize: "12px", color: c.accentPop, marginTop: "0.5rem", fontFamily: SANS, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Optional — skip if unsure
            </div>
          )}
        </div>

        <div>
          {q.options.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginBottom: "1.1rem" }}>
              {q.options.map(opt => {
                const selected = multiSelected.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleMultiSelect1(opt)}
                    disabled={loading}
                    style={{
                      background: selected ? c.accent : c.bgInput,
                      border: `1.5px solid ${selected ? c.accent : c.borderMid}`,
                      borderRadius: "10px",
                      padding: "12px 20px",
                      fontSize: "16px",
                      color: selected ? "#fff" : c.textPrimary,
                      cursor: loading ? "default" : "pointer",
                      fontFamily: SERIF,
                      fontWeight: selected ? 600 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {selected ? "✓ " : ""}{opt}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${needsSomewhereElseDetail ? c.accent : c.borderMid}`, borderRadius: "12px", padding: "12px 16px" }}>
            <div style={{ fontSize: "12px", color: needsSomewhereElseDetail ? c.accent : c.textMuted, fontFamily: SANS, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {detailLabel}
            </div>
            <textarea
              value={textDraft}
              onChange={e => setTextDraft(e.target.value)}
              onKeyDown={handleTextKeyDown(submitT1Multi)}
              placeholder="Type here..."
              rows={3}
              autoFocus={q.options.length === 0}
              style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "17px", fontFamily: SERIF, lineHeight: 1.7, resize: "none", width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.75rem" }}>
              {blocked && (
                <div style={{ fontSize: "12px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic" }}>
                  Please fill this in to continue
                </div>
              )}
              <button
                onClick={submitT1Multi}
                disabled={loading || blocked}
                style={{ background: loading || blocked ? c.accentMid : c.accent, border: "none", borderRadius: "4px", padding: "8px 20px", cursor: loading ? "default" : "pointer", color: loading || blocked ? c.textMuted : "#fff", fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
              >
                {loading ? "Reading…" : "Next \u2192"}
              </button>
            </div>
          </div>
        </div>
        <Disclaimer />
      </div>
    </div>
  );
}

// ---- BODY PART FORM (one screen per selected body part, with all of its
// sub-questions — side, front/back, sensation, pattern — grouped together
// so the person can answer everything about that part at once) ----

function BodyPartFormScreen({ q, index, total, loading, bodyPartSelections, toggleBodyPartOption, setBodyPartDetail, handleTextKeyDown, submitBodyPartForm }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sideGroup = q.groups.find(g => g.key === "side");
  const otherGroups = q.groups.filter(g => g.key !== "side");
  const bothSides = q.hasSide && (bodyPartSelections.side || []).includes("Both sides");
  const detailMissing = q.detailRequired && !(bothSides
    ? ((bodyPartSelections.left_detail || "").trim() || (bodyPartSelections.right_detail || "").trim())
    : (bodyPartSelections.detail || "").trim());

  const renderOptionGroup = (group, stateKey, labelPrefix) => (
    <div key={stateKey} style={{ marginBottom: "1.4rem" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: c.textPrimary, marginBottom: "0.6rem", fontFamily: SANS }}>
        {labelPrefix ? `${labelPrefix}: ${group.label}` : group.label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {group.options.map(opt => {
          const selected = (bodyPartSelections[stateKey] || []).includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggleBodyPartOption(stateKey, opt)}
              disabled={loading}
              style={{
                background: selected ? c.accent : c.bgInput,
                border: `1.5px solid ${selected ? c.accent : c.borderMid}`,
                borderRadius: "8px",
                padding: "9px 16px",
                fontSize: "14px",
                color: selected ? "#fff" : c.textPrimary,
                cursor: loading ? "default" : "pointer",
                fontFamily: SERIF,
                fontWeight: selected ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {selected ? "✓ " : ""}{opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDetailBox = (detailKey, label) => (
    <div key={detailKey} style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "12px", padding: "12px 16px", marginBottom: "1rem" }}>
      <div style={{ fontSize: "12px", color: c.textMuted, fontFamily: SANS, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <textarea
        value={bodyPartSelections[detailKey] || ""}
        onChange={e => setBodyPartDetail(detailKey, e.target.value)}
        onKeyDown={handleTextKeyDown(submitBodyPartForm)}
        placeholder="Type here..."
        rows={2}
        style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "16px", fontFamily: SERIF, lineHeight: 1.6, resize: "none", width: "100%" }}
      />
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "620px" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "1rem", fontFamily: SANS }}>
            Free Reading · Question {index + 1} of {total}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: c.textPrimary, marginBottom: "0.5rem", lineHeight: 1.3, fontFamily: SANS, letterSpacing: "-0.01em", textTransform: "capitalize" }}>
            Tell us about your {q.bodyPart}
          </div>
          <div style={{ fontSize: "13px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic" }}>
            Select whatever applies below — skip anything that doesn't make sense for this body part.
          </div>
        </div>

        <div style={{ maxHeight: "54vh", overflowY: "auto", paddingRight: "4px" }}>
          {sideGroup && renderOptionGroup(sideGroup, "side", null)}

          {bothSides ? (
            <>
              <div style={{ fontSize: "12px", fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: "0.08em", margin: "1.2rem 0 0.8rem", borderTop: `1px solid ${c.borderMid}`, paddingTop: "1rem" }}>
                Left {q.bodyPart}
              </div>
              {otherGroups.map(g => renderOptionGroup(g, `left_${g.key}`, null))}
              {renderDetailBox("left_detail", `Do you know when this first started in your left ${q.bodyPart}, or what the situation was when it appeared? (optional)`)}

              <div style={{ fontSize: "12px", fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0.4rem 0 0.8rem", borderTop: `1px solid ${c.borderMid}`, paddingTop: "1rem" }}>
                Right {q.bodyPart}
              </div>
              {otherGroups.map(g => renderOptionGroup(g, `right_${g.key}`, null))}
              {renderDetailBox("right_detail", `Do you know when this first started in your right ${q.bodyPart}, or what the situation was when it appeared? (optional)`)}
            </>
          ) : (
            <>
              {otherGroups.map(g => renderOptionGroup(g, g.key, null))}
              {renderDetailBox("detail", q.detailLabel)}
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
          {detailMissing && (
            <div style={{ fontSize: "12px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic" }}>
              Please fill this in to continue
            </div>
          )}
          <button
            onClick={submitBodyPartForm}
            disabled={loading || detailMissing}
            style={{ background: loading || detailMissing ? c.accentMid : c.accent, border: "none", borderRadius: "4px", padding: "10px 24px", cursor: (loading || detailMissing) ? "default" : "pointer", color: (loading || detailMissing) ? c.textMuted : "#fff", fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
          >
            {loading ? "Reading…" : "Next \u2192"}
          </button>
        </div>
        <Disclaimer />
      </div>
    </div>
  );
}

// ---- TIER 2 PROGRESS BAR (subtle indicator of how close the ongoing
// conversation is to having enough for the full Root Cause Reading) ----

function Tier2ProgressBar({ progress }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: c.textMuted, fontFamily: SANS }}>
          Root Cause Reading
        </div>
        <div style={{ fontSize: "10px", color: c.textMuted, fontFamily: SANS }}>{progress}%</div>
      </div>
      <div style={{ height: "3px", background: c.borderMid, borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: c.accent, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ fontSize: "11px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic", marginTop: "5px" }}>
        Your complete, in-depth reading unlocks at 100% — the more detail you share, the faster it gets there.
      </div>
    </div>
  );
}

// ---- SIMPLE CHAT INPUT (shared lightweight style for the dynamic Tier 2
// conversation and the post-reading follow-up chat) ----

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

// ---- READING TRANSCRIPT (also hoisted, same reason) ----

function Transcript({ messages, loading, messagesEndRef, lastMessageRef, ctaSlot, loadingLabel }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", maxWidth: "700px", width: "100%", margin: "0 auto" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 1.5rem" }}>
        <div style={{ paddingTop: "2rem" }}>
          {messages.map((msg, i) => msg.hidden ? null : (
            <div key={i} ref={i === messages.length - 1 ? lastMessageRef : null} style={{ marginBottom: "2rem" }}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: c.userBubble, border: `1px solid ${c.userBubbleBorder}`, borderRadius: "14px 14px 2px 14px", padding: "12px 18px", maxWidth: "85%", fontSize: "15px", lineHeight: 1.65, color: c.textSecondary, whiteSpace: "pre-wrap", fontFamily: SERIF }}>
                    {msg.display || msg.content}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: c.accentLight, border: `1px solid ${c.borderMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: c.accent, flexShrink: 0, marginTop: "2px", fontFamily: SANS }}>&#10022;</div>
                  <div style={{ flex: 1, fontSize: "18px", color: c.textPrimary, fontFamily: SERIF }}>{formatMessage(msg.content)}</div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "2rem" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: c.accentLight, border: `1px solid ${c.borderMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: c.accent, flexShrink: 0 }}>&#10022;</div>
              <div style={{ paddingTop: "6px" }}>
                {loadingLabel && (
                  <div style={{ fontSize: "13px", color: c.textMuted, fontFamily: SANS, marginBottom: "6px" }}>{loadingLabel}</div>
                )}
                <div style={{ display: "flex", gap: "5px" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.accent, animation: `bast-pulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.45 }} />
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

// ---- INTAKE QUESTIONS -------------------------------------------------

const QUESTIONS_TIER1 = [
  {
    id: "diagnosis",
    type: "multiselect",
    q: "Do you have a medical diagnosis (or diagnoses) connected to what's going on?",
    detailLabel: "If yes, what's the diagnosis? (optional, but helpful)",
    options: [
      "Yes",
      "Yes, and I also want to explore something separate from that diagnosis",
      "No diagnosis — just exploring a symptom or health issue",
    ],
  },
  {
    id: "region",
    type: "multiselect",
    q: "Where in the body is this happening?",
    detailLabel: "Anything else to add about where or how it shows up? (optional)",
    options: [
      "Head", "Neck", "Throat", "Shoulders", "Chest", "Heart",
      "Upper Back", "Lower Back", "Abdomen", "Gut", "Hips", "Pelvis",
      "Legs", "Knees", "Ankles", "Feet", "Arms", "Hands", "Somewhere else",
    ],
  },
  {
    id: "side",
    type: "multiselect",
    q: "Is it more on the left side, the right side, centered, or on both sides?",
    detailLabel: "Anything else to add? (optional)",
    options: ["Left side", "Right side", "Centered", "Both sides"],
  },
  {
    id: "plane",
    type: "multiselect",
    q: "Do you feel it more toward the front, more toward the back, or both at once?",
    detailLabel: "Anything else to add? (optional)",
    options: ["Front", "Back", "Both at once"],
  },
  {
    id: "quality",
    type: "multiselect",
    q: "How would you describe it?",
    detailLabel: "Anything else to add about how it feels? (optional)",
    options: ["Sharp", "Dull ache", "Sore", "Burning", "Tight", "Stiff", "Throbbing", "Numb", "Cramping", "Tingling", "Swollen", "Pressure", "Heavy", "Weak"],
  },
  {
    id: "pattern",
    type: "multiselect",
    q: "Is this the first time you've had this, does it come and go, or is it constant / ongoing?",
    detailLabel: "Anything else to add about the pattern? (optional)",
    options: ["First time", "Comes and goes", "Constant / ongoing"],
  },
  {
    id: "context",
    type: "multiselect",
    q: "Is there anything stressful going on in your life right now?",
    detailLabel: "Explain more — what's going on, specifically?",
    options: ["Work stress", "Relationship or family stress", "Grief or loss", "Major life transition", "Financial stress", "Caregiving responsibilities"],
  },
];

// ---- DIAGNOSIS ROUTING ----
// The diagnosis question (always first) changes what the rest of Tier 1
// looks like:
//   - "focused on diagnosis" ONLY -> skip the remaining 6 questions
//     entirely; the reading is built from the diagnosis alone.
//   - "focused on diagnosis" AND "separate thing" both selected -> keep
//     the remaining 6 questions, but reword them to make unmistakably
//     clear they're asking about the OTHER thing, not the diagnosis.
//   - anything else (separate only, no diagnosis, or skipped) -> normal,
//     unmodified flow.

const DIAGNOSIS_YES = "Yes";
const DIAGNOSIS_ALSO_SEPARATE = "Yes, and I also want to explore something separate from that diagnosis";

const SEPARATE_REFRAME = {
  region: "Setting the diagnosis aside for a moment — where in the body is this separate thing happening?",
  side: "For this separate thing — is it more on the left side, the right side, centered, or on both sides?",
  plane: "For this separate thing — do you feel it more toward the front, more toward the back, or both at once?",
  quality: "How would you describe this separate thing?",
  pattern: "Is this separate thing the first time you've had it, does it come and go, or is it constant / ongoing?",
  context: "Setting the diagnosis aside — what's actually going on in your life right now connected to this other thing?",
};

// Required follow-up when someone wants the reading focused on their
// diagnosis but hasn't actually named it yet — there's nothing to
// interpret without this.
const DIAGNOSIS_NAME_QUESTION = {
  id: "diagnosisName",
  type: "multiselect",
  q: "What is your diagnosis (or diagnoses)?",
  detailLabel: "List everything that applies — this is what the reading will be built from.",
  options: [],
  required: true,
};

function buildEffectiveTier1Questions(diagnosisAnswer) {
  const selected = (diagnosisAnswer && diagnosisAnswer.selected) || [];
  // "Yes, and I also want to explore something separate..." already implies
  // "Yes" on its own, so it alone is enough to trigger the combined case
  // regardless of whether "Yes" was also separately toggled.
  const alsoSeparate = selected.includes(DIAGNOSIS_ALSO_SEPARATE);
  const hasDiagnosis = alsoSeparate || selected.includes(DIAGNOSIS_YES);
  const alreadyNamed = !!(diagnosisAnswer && diagnosisAnswer.detail && diagnosisAnswer.detail.trim());
  const nameStep = alreadyNamed ? [] : [DIAGNOSIS_NAME_QUESTION];

  if (hasDiagnosis && !alsoSeparate) {
    // Reading will be built entirely from the diagnosis — nothing else
    // needed, but we do need to actually know what it is first.
    return [QUESTIONS_TIER1[0], ...nameStep];
  }

  if (hasDiagnosis && alsoSeparate) {
    // They want both — get the diagnosis name if we don't have it yet,
    // then reword the rest so it's unambiguous those questions are about
    // the separate issue, not the diagnosis.
    const reframed = QUESTIONS_TIER1.slice(1).map(q => ({
      ...q,
      q: SEPARATE_REFRAME[q.id] || q.q,
    }));
    return [QUESTIONS_TIER1[0], ...nameStep, ...reframed];
  }

  // No diagnosis, or skipped — normal flow.
  return QUESTIONS_TIER1;
}

// A single "left / right / both" answer can't capture "left arm but right
// knee," and a generic reworded question doesn't make clear which body
// part it's still asking about once several are in play. So instead: once
// someone selects their region(s), each one gets its own single form —
// side, front/back, sensation, and pattern all together — replacing the
// generic side/plane/quality/pattern questions entirely.
const REGION_DISPLAY = {
  "Head": "head", "Neck": "neck", "Throat": "throat", "Shoulders": "shoulder",
  "Chest": "chest", "Heart": "heart", "Upper Back": "upper back", "Lower Back": "lower back",
  "Abdomen": "abdomen", "Gut": "gut", "Hips": "hip", "Pelvis": "pelvis",
  "Legs": "leg", "Knees": "knee", "Ankles": "ankle", "Feet": "foot",
  "Arms": "arm", "Hands": "hand", "Somewhere else": "the area you mentioned",
};

// Not every body part has a meaningful left/right or front/back — a gut
// or a throat doesn't split that way the way a knee or a shoulder does.
// Quality and pattern always apply; side and plane only show up where
// they'd actually mean something.
const REGION_GROUP_CONFIG = {
  "Head": { side: true, plane: true, centered: true },
  "Neck": { side: true, plane: true, centered: true },
  "Throat": { side: false, plane: false, centered: false },
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
  "Arms": { side: true, plane: true, centered: false },
  "Hands": { side: true, plane: true, centered: false },
  "Somewhere else": { side: false, plane: false, centered: false },
};

function regionDisplayName(region) {
  return REGION_DISPLAY[region] || region.toLowerCase();
}

function buildBodyPartForm(region) {
  const display = regionDisplayName(region);
  const slug = display.replace(/\s+/g, "_");
  const config = REGION_GROUP_CONFIG[region] || { side: true, plane: true };

  const groups = [];
  if (config.side) {
    const sideOptions = ["Left", "Right", "Both sides"];
    if (config.centered) sideOptions.push("Centered");
    groups.push({ key: "side", label: "Which side?", options: sideOptions });
  }
  if (config.plane) groups.push({ key: "plane", label: "Front or back?", options: ["Front", "Back", "Both front and back"] });
  groups.push({ key: "quality", label: "What does it feel like?", options: ["Sharp", "Dull ache", "Sore", "Burning", "Tight", "Stiff", "Throbbing", "Numb", "Cramping", "Tingling", "Swollen", "Pressure", "Heavy", "Weak"] });
  groups.push({ key: "pattern", label: "Is this the first time, does it come and go, or is it constant / ongoing?", options: ["First time", "Comes and goes", "Constant / ongoing"] });

  return {
    id: `bodypart_${slug}`,
    type: "bodyPartForm",
    bodyPart: display,
    hasSide: config.side,
    groups,
    detailLabel: `Do you know when this first started, or what the situation was when it first appeared? (optional)`,
  };
}

function patchQuestionsForBodyParts(questions, regionAnswer) {
  const selected = (regionAnswer && regionAnswer.selected) || [];
  if (selected.length === 0) return questions;

  const bodyPartForms = selected.map(buildBodyPartForm);

  return questions.flatMap(q => {
    if (q.id === "side") return bodyPartForms;
    if (q.id === "plane" || q.id === "quality" || q.id === "pattern") return [];
    return [q];
  });
}

function formatAnswerValue(ans) {
  if (ans && typeof ans === "object" && ("selected" in ans || "detail" in ans)) {
    const parts = [];
    if (ans.selected && ans.selected.length) parts.push(ans.selected.join(", "));
    if (ans.detail && ans.detail.trim()) parts.push(`Additional detail: ${ans.detail.trim()}`);
    return parts.length ? parts.join(" — ") : "(skipped)";
  }
  const trimmed = (ans || "").toString().trim();
  return trimmed ? trimmed : "(skipped)";
}

function formatBodyPartAnswer(ans) {
  if (!ans) return "(skipped)";
  const parts = [];
  if (ans.side && ans.side.length) parts.push(`Side: ${ans.side.join(", ")}`);

  const bothSides = ans.side && ans.side.includes("Both sides");
  if (bothSides) {
    const sideParts = (prefix, label) => {
      const p = [];
      if (ans[`${prefix}_plane`]?.length) p.push(`Front/back: ${ans[`${prefix}_plane`].join(", ")}`);
      if (ans[`${prefix}_quality`]?.length) p.push(`Sensation: ${ans[`${prefix}_quality`].join(", ")}`);
      if (ans[`${prefix}_pattern`]?.length) p.push(`Pattern: ${ans[`${prefix}_pattern`].join(", ")}`);
      if (ans[`${prefix}_detail`]?.trim()) p.push(`Detail: ${ans[`${prefix}_detail`].trim()}`);
      if (p.length) parts.push(`${label} — ${p.join(" | ")}`);
    };
    sideParts("left", "Left side");
    sideParts("right", "Right side");
  } else {
    if (ans.plane && ans.plane.length) parts.push(`Front/back: ${ans.plane.join(", ")}`);
    if (ans.quality && ans.quality.length) parts.push(`Sensation: ${ans.quality.join(", ")}`);
    if (ans.pattern && ans.pattern.length) parts.push(`Pattern: ${ans.pattern.join(", ")}`);
    if (ans.detail && ans.detail.trim()) parts.push(`Additional detail: ${ans.detail.trim()}`);
  }
  return parts.length ? parts.join(" | ") : "(skipped)";
}

function compileAnswers(questions, answers) {
  return questions
    .map(q => {
      if (q.type === "bodyPartForm") {
        return `Regarding your ${q.bodyPart}:\n${formatBodyPartAnswer(answers[q.id])}`;
      }
      return `${q.q}\n${formatAnswerValue(answers[q.id])}`;
    })
    .join("\n\n");
}

// ---- DYNAMIC ROOT CAUSE CONVERSATION ----
// Tier 2 no longer uses a fixed question list. The model asks its own
// questions and reports progress via a status marker at the end of every
// turn: [[TIER2_STATUS progress=NN next=ask|ready]]. This parses that
// marker out and strips it from what actually gets displayed/stored.

const TIER2_MAX_TURNS = 12; // safety cap in case the model never signals ready

function parseTier2Status(text) {
  const bracketMatch = text.match(/\[\[TIER2_STATUS[^\]]*\]\]/i);
  const bracketText = bracketMatch ? bracketMatch[0] : "";
  const progressMatch = bracketText.match(/progress\s*=\s*(\d+)/i);
  const nextMatch = bracketText.match(/next\s*=\s*(ask|ready)/i);
  const cleaned = (bracketMatch ? text.replace(bracketMatch[0], "") : text).trim();
  return {
    cleaned,
    progress: progressMatch ? Math.max(0, Math.min(100, parseInt(progressMatch[1], 10))) : null,
    ready: nextMatch ? nextMatch[1].toLowerCase() === "ready" : null,
  };
}

export default function BASTInterpreter() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("bast_messages");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  // step: 'tier1' -> 'tier2' -> 'chat'
  const [step, setStep] = useState(() => {
    try { return localStorage.getItem("bast_step") || "tier1"; }
    catch { return "tier1"; }
  });
  const [t1Index, setT1Index] = useState(0);
  const [answersT1, setAnswersT1] = useState({});
  const [multiSelected, setMultiSelected] = useState([]);
  const [bodyPartSelections, setBodyPartSelections] = useState({});
  const [effectiveTier1Questions, setEffectiveTier1Questions] = useState(QUESTIONS_TIER1);
  const [tier2Draft, setTier2Draft] = useState("");
  const [tier2Progress, setTier2Progress] = useState(0);
  const [tier2Turn, setTier2Turn] = useState(0);
  const [textDraft, setTextDraft] = useState("");
  const [followUp, setFollowUp] = useState("");

  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (loading) {
      // Still generating — keep the loading indicator in view.
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      // A reading just landed — show its beginning, not its end.
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, messages]);

  useEffect(() => {
    try { localStorage.setItem("bast_messages", JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem("bast_step", step); } catch {}
  }, [step]);

  const clearHistory = () => {
    setMessages([]);
    setAnswersT1({});
    setMultiSelected([]);
    setBodyPartSelections({});
    setEffectiveTier1Questions(QUESTIONS_TIER1);
    setT1Index(0);
    setTier2Draft("");
    setTier2Progress(0);
    setTier2Turn(0);
    setTextDraft("");
    setFollowUp("");
    setStep("tier1");
    try {
      localStorage.removeItem("bast_messages");
      localStorage.removeItem("bast_step");
    } catch {}
  };

  async function callAPI(newMessages, maxTokens) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens || 4000,
        system: SYSTEM_PROMPT,
        // Strip the local-only "display" field — the API only accepts
        // role/content on message objects.
        messages: newMessages.map(({ role, content }) => ({ role, content })),
      }),
    });
    const data = await response.json();
    return data.content?.find(b => b.type === "text")?.text
      || "Something went wrong. Please try again.";
  }

  // ---- TIER 1 MULTI-SELECT ANSWER HANDLING ----

  const toggleMultiSelect1 = (option) => {
    setMultiSelected(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const submitT1Multi = () => {
    const q = effectiveTier1Questions[t1Index];
    const needsSomewhereElseDetail = q.id === "region" && multiSelected.includes("Somewhere else");
    const blocked = (q.required && multiSelected.length === 0 && !textDraft.trim())
      || (needsSomewhereElseDetail && !textDraft.trim());
    if (blocked) return;
    const latest = { ...answersT1, [q.id]: { selected: multiSelected, detail: textDraft } };
    setAnswersT1(latest);
    setMultiSelected([]);
    setTextDraft("");
    if (q.id === "diagnosis") {
      const effective = buildEffectiveTier1Questions(latest.diagnosis);
      setEffectiveTier1Questions(effective);
      advanceT1(latest, effective);
    } else if (q.id === "region") {
      const effective = patchQuestionsForBodyParts(effectiveTier1Questions, latest.region);
      setEffectiveTier1Questions(effective);
      advanceT1(latest, effective);
    } else {
      advanceT1(latest);
    }
  };

  const toggleBodyPartOption = (groupKey, option) => {
    setBodyPartSelections(prev => {
      const current = prev[groupKey] || [];
      const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
      return { ...prev, [groupKey]: next };
    });
  };

  const setBodyPartDetail = (detailKey, value) => {
    setBodyPartSelections(prev => ({ ...prev, [detailKey]: value }));
  };

  const submitBodyPartForm = () => {
    const q = effectiveTier1Questions[t1Index];
    if (q.detailRequired) {
      const bothSides = q.hasSide && (bodyPartSelections.side || []).includes("Both sides");
      const filled = bothSides
        ? ((bodyPartSelections.left_detail || "").trim() || (bodyPartSelections.right_detail || "").trim())
        : (bodyPartSelections.detail || "").trim();
      if (!filled) return;
    }
    const latest = { ...answersT1, [q.id]: { ...bodyPartSelections } };
    setAnswersT1(latest);
    setBodyPartSelections({});
    advanceT1(latest);
  };

  const fetchInitialReading = async (latestAnswers, questionsList) => {
    const list = questionsList || effectiveTier1Questions;
    setLoading(true);
    const compiled = compileAnswers(list, latestAnswers);
    const userMsg = {
      role: "user",
      content: `Here is the intake for an Initial Reading:\n\n${compiled}\n\nProvide an Initial Reading based on this intake.`,
      display: compiled,
      hidden: true,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    try {
      const text = await callAPI(newMessages);
      const withInitialReading = [...newMessages, { role: "assistant", content: text }];
      setMessages(withInitialReading);

      // Continue straight into the deeper conversation — no pause, no button.
      // The tool is entirely free, so there's nothing left to gate.
      const kickoffMsg = {
        role: "user",
        content: "The person just received their free Initial Reading, and the conversation now continues naturally into a deeper Root Cause conversation. Ask them your first question now — the single most useful thing to understand next, following naturally from the Initial Reading and everything in the intake. Keep the transition conversational, as though the conversation is simply continuing rather than entering some new unlocked tier. End with the required status marker.",
        hidden: true,
      };
      await advanceTier2Conversation([...withInitialReading, kickoffMsg]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "There was a connection error. Please try again." }]);
      setLoading(false);
    }
  };

  const advanceT1 = (latestAnswers, questionsList) => {
    const list = questionsList || effectiveTier1Questions;
    if (t1Index < list.length - 1) {
      setT1Index(t1Index + 1);
      return;
    }
    // Tier 1 complete (or short-circuited because the diagnosis alone was
    // enough) — request Initial Reading.
    fetchInitialReading(latestAnswers, list);
  };

  // Pick up Tier 1 answers passed in via URL params from the landing
  // page's quiz (diagnosis + region), so a person doesn't have to
  // re-answer those two here. Everything body-part-specific still
  // happens in the app, where the full grouped form actually fits.
  //
  // Important: arriving here with a "diagnosis" param means the person
  // just came from the landing page and wants a fresh start — this must
  // win over whatever session happens to be sitting in localStorage from
  // a previous visit. (An earlier version gated this on "is there already
  // a conversation in memory," which silently broke the whole handoff any
  // time there was leftover session data — the app would just render the
  // Tier 1 wizard from scratch and ignore the URL entirely.)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (!params.has("diagnosis")) return;

      setMessages([]);
      try {
        localStorage.removeItem("bast_messages");
        localStorage.removeItem("bast_step");
      } catch {}

      const diagnosisRaw = params.get("diagnosis") || "";
      const diagnosisSelected = diagnosisRaw.split("||").map(s => s.trim()).filter(Boolean);
      const diagnosisDetail = params.get("diagnosis_detail") || "";
      const diagnosisAnswer = { selected: diagnosisSelected, detail: diagnosisDetail };
      const effective = buildEffectiveTier1Questions(diagnosisAnswer);
      const ids = effective.map(q => q.id);

      // Diagnosis-focused-only: region was never asked, so everything
      // needed is already in the URL — go straight to the Initial Reading.
      if (!ids.includes("region")) {
        if (!ids.every(id => params.has(id))) { setStep("tier1"); setT1Index(0); return; }
        const fromUrl = {};
        ids.forEach(id => {
          const raw = params.get(id) || "";
          const selected = raw.split("||").map(s => s.trim()).filter(Boolean);
          const detail = params.get(`${id}_detail`) || "";
          fromUrl[id] = { selected, detail };
        });
        setAnswersT1(fromUrl);
        setEffectiveTier1Questions(effective);
        setStep("tier1");
        fetchInitialReading(fromUrl, effective);
        return;
      }

      // Otherwise the landing page sent diagnosis (+ name, if needed) and
      // region — pick those up, expand into the per-body-part forms, and
      // drop the person right at the first one instead of starting over.
      const preIds = ids.slice(0, ids.indexOf("region") + 1);
      if (!preIds.every(id => params.has(id))) { setStep("tier1"); setT1Index(0); return; }

      const fromUrl = {};
      preIds.forEach(id => {
        const raw = params.get(id) || "";
        const selected = raw.split("||").map(s => s.trim()).filter(Boolean);
        const detail = params.get(`${id}_detail`) || "";
        fromUrl[id] = { selected, detail };
      });

      const patchedEffective = patchQuestionsForBodyParts(effective, fromUrl.region);
      setAnswersT1(fromUrl);
      setEffectiveTier1Questions(patchedEffective);
      setStep("tier1");
      setT1Index(patchedEffective.findIndex(q => q.id === "region") + 1);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- DYNAMIC ROOT CAUSE CONVERSATION ----
  // No fixed question list. Each turn: send the conversation so far, get
  // back an in-depth response ending in a status marker, parse out the
  // marker, and either continue the conversation or trigger the final
  // unlimited-depth Root Cause Reading.

  const requestFinalRootCauseReading = async (priorMessages) => {
    const userMsg = {
      role: "user",
      content: "You now have everything you need from this conversation. Write the complete Root Cause Reading now — the full, unlimited-depth synthesis drawing on the Initial Reading and everything shared in this conversation. Do not include the status marker on this response; this is the final reading, not another conversation turn.",
      display: "Let's see the complete Root Cause Reading.",
    };
    const newMessages = [...priorMessages, userMsg];
    setMessages(newMessages);
    const text = await callAPI(newMessages, 8000);
    setMessages(prev => [...prev, { role: "assistant", content: text }]);
    setTier2Progress(100);
    setStep("chat");
  };

  const advanceTier2Conversation = async (messagesForApi) => {
    setLoading(true);
    setMessages(messagesForApi);
    try {
      const raw = await callAPI(messagesForApi, 4000);
      const { cleaned, progress, ready } = parseTier2Status(raw);
      const withReply = [...messagesForApi, { role: "assistant", content: cleaned }];
      setMessages(withReply);

      const nextTurn = tier2Turn + 1;
      setTier2Turn(nextTurn);
      setTier2Progress(progress != null ? progress : Math.min(95, tier2Progress + 15));

      const forceReady = nextTurn >= TIER2_MAX_TURNS;
      if (ready || forceReady) {
        await requestFinalRootCauseReading(withReply);
      } else {
        setStep("tier2");
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "There was a connection error. Please try again." }]);
      setStep("tier2");
    }
    setLoading(false);
  };

  const submitTier2Answer = () => {
    const trimmed = tier2Draft.trim();
    if (!trimmed || loading) return;
    const userMsg = {
      role: "user",
      content: `${trimmed}\n\n(Continue the Root Cause conversation: respond in real depth to this specific answer, connecting it to everything established so far. Then either ask the single most useful next question, or — only if you genuinely have enough rich material — signal you're ready for the full reading instead. End with the required status marker.)`,
      display: trimmed,
    };
    setTier2Draft("");
    advanceTier2Conversation([...messages, userMsg]);
  };

  // ---- FREEFORM FOLLOW-UP (post Root Cause Reading) ----

  const handleFollowUpSubmit = async () => {
    if (!followUp.trim() || loading) return;
    const userMessage = { role: "user", content: followUp.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setFollowUp("");
    setLoading(true);
    try {
      const text = await callAPI(newMessages);
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "There was a connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const handleFollowUpKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleFollowUpSubmit(); }
  };

  const handleTextKeyDown = (submitFn) => (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitFn(); }
  };

  // ---- RENDER: TIER 1 WIZARD ----

  if (step === "tier1" && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
        <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
        {t1Index === 0 && (
          <div style={{ textAlign: "center", maxWidth: "620px", margin: "1.5rem auto 0", padding: "0 1.5rem" }}>
            <div style={{ fontSize: "27px", fontWeight: 700, color: c.textPrimary, lineHeight: 1.2, fontFamily: SANS, letterSpacing: "-0.01em" }}>
              What is your body trying to tell you?
            </div>
            <div style={{ fontSize: "17px", color: c.textSecondary, lineHeight: 1.8, fontFamily: SERIF, marginTop: "0.75rem" }}>
              Answer a few quick questions and we'll give you a free Initial Reading.
            </div>
          </div>
        )}
        {effectiveTier1Questions[t1Index]?.type === "bodyPartForm" ? (
          <BodyPartFormScreen
            key={t1Index}
            q={effectiveTier1Questions[t1Index]}
            index={t1Index}
            total={effectiveTier1Questions.length}
            loading={loading}
            bodyPartSelections={bodyPartSelections}
            toggleBodyPartOption={toggleBodyPartOption}
            setBodyPartDetail={setBodyPartDetail}
            handleTextKeyDown={handleTextKeyDown}
            submitBodyPartForm={submitBodyPartForm}
          />
        ) : (
          <QuestionScreen key={t1Index} questions={effectiveTier1Questions} index={t1Index} tierLabel="Free Reading" loading={loading} textDraft={textDraft} setTextDraft={setTextDraft} handleTextKeyDown={handleTextKeyDown} multiSelected={multiSelected} toggleMultiSelect1={toggleMultiSelect1} submitT1Multi={submitT1Multi} />
        )}
        <style>{`* { box-sizing: border-box; } body { margin: 0; } textarea::placeholder { color: rgba(30,26,22,0.3); }`}</style>
      </div>
    );
  }

  // ---- RENDER: TIER 2 (dynamic, open-ended conversation — plain input,
  // subtle progress indicator, no fixed question card) ----

  if (step === "tier2" && !loading) {
    return (
      <div style={{ height: "100vh", overflow: "hidden", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
        <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
        <div style={{ flexShrink: 0, maxWidth: "700px", width: "100%", margin: "0 auto", padding: "0.85rem 1.5rem 0" }}>
          <Tier2ProgressBar progress={tier2Progress} />
        </div>
        <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef} lastMessageRef={lastMessageRef}
          ctaSlot={
            <>
              <SimpleChatInput
                value={tier2Draft}
                onChange={setTier2Draft}
                onSubmit={submitTier2Answer}
                placeholder="Type your answer..."
                loading={loading}
                handleTextKeyDown={handleTextKeyDown}
              />
              <Disclaimer />
            </>
          }
        />
        <style>{`* { box-sizing: border-box; } body { margin: 0; } textarea::placeholder { color: rgba(30,26,22,0.3); }`}</style>
      </div>
    );
  }

  // ---- RENDER: CHAT (post Root Cause Reading, or mid-request loading state) ----

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
      <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
      {step === "tier2" && (
        <div style={{ flexShrink: 0, maxWidth: "700px", width: "100%", margin: "0 auto", padding: "0.85rem 1.5rem 0" }}>
          <Tier2ProgressBar progress={tier2Progress} />
        </div>
      )}
      <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef} lastMessageRef={lastMessageRef}
        loadingLabel={step === "tier1" && loading ? "Building your Energetic Root Cause reading..." : undefined}
        ctaSlot={
          step === "chat" ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "10px", padding: "10px 14px" }}>
                <textarea
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  onKeyDown={handleFollowUpKeyDown}
                  placeholder="Ask a follow-up or describe another symptom..."
                  rows={2}
                  style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "18px", fontFamily: SERIF, lineHeight: 1.6, resize: "none", width: "100%" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleFollowUpSubmit}
                    disabled={!followUp.trim() || loading}
                    style={{ background: followUp.trim() && !loading ? c.accent : c.accentMid, border: "none", borderRadius: "4px", padding: "7px 18px", cursor: followUp.trim() && !loading ? "pointer" : "default", color: followUp.trim() && !loading ? "#fff" : c.textMuted, fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em" }}
                  >
                    Send &rarr;
                  </button>
                </div>
              </div>
              <Disclaimer />
            </>
          ) : null
        }
      />
      <style>{`
        @keyframes bast-pulse { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.8; transform: scale(1); } }
        textarea::placeholder { color: rgba(30,26,22,0.3); }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
