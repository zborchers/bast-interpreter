import { useState, useRef, useEffect } from "react";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

const SANS = "'Plus Jakarta Sans','system-ui',sans-serif";
const SERIF = "'Crimson Text','Georgia',serif";
const ACCESS_PASSWORD = "bodyspeak";

async function validateLicenseKey(key) {
  return key.trim().toLowerCase() === ACCESS_PASSWORD;
}

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
        <div style={{ fontSize: "17px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS }}>The Voltage Reading</div>
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
  const q = questions[index];

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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "12px", padding: "12px 16px" }}>
            <div style={{ fontSize: "12px", color: c.textMuted, fontFamily: SANS, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {q.detailLabel || "Anything else to add? (optional)"}
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
              {q.required && multiSelected.length === 0 && !textDraft.trim() && (
                <div style={{ fontSize: "12px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic" }}>
                  Please fill this in to continue
                </div>
              )}
              <button
                onClick={submitT1Multi}
                disabled={loading || (q.required && multiSelected.length === 0 && !textDraft.trim())}
                style={{ background: loading || (q.required && multiSelected.length === 0 && !textDraft.trim()) ? c.accentMid : c.accent, border: "none", borderRadius: "4px", padding: "8px 20px", cursor: loading ? "default" : "pointer", color: loading || (q.required && multiSelected.length === 0 && !textDraft.trim()) ? c.textMuted : "#fff", fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
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

function Transcript({ messages, loading, messagesEndRef, ctaSlot }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", maxWidth: "700px", width: "100%", margin: "0 auto" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 1.5rem" }}>
        <div style={{ paddingTop: "2rem" }}>
          {messages.map((msg, i) => msg.hidden ? null : (
            <div key={i} style={{ marginBottom: "2rem" }}>
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
              <div style={{ paddingTop: "8px", display: "flex", gap: "5px" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.accent, animation: `bast-pulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.45 }} />
                ))}
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
      "Head / Mind", "Neck / Throat", "Shoulders", "Chest / Heart",
      "Upper Back", "Lower Back", "Abdomen / Gut", "Hips / Pelvis",
      "Legs / Knees", "Ankles / Feet", "Arms / Hands", "Somewhere else",
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
    options: ["Sharp", "Dull ache", "Burning", "Tight", "Throbbing", "Numb", "Cramping", "Tingling"],
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
    q: "What's actually going on in your life right now — what's been on your mind or on your plate?",
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

function compileAnswers(questions, answers) {
  return questions
    .map(q => `${q.q}\n${formatAnswerValue(answers[q.id])}`)
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
  const [loading, setLoading] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const saved = localStorage.getItem("bast_messages");
      const hasSavedSession = saved && JSON.parse(saved).length > 0;
      return !hasSavedSession && params.has("diagnosis");
    } catch { return false; }
  });
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem("bast_unlocked") === "true"; }
    catch { return false; }
  });
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);

  // step: 'tier1' -> 'paywall' -> 'tier2' -> 'chat'
  const [step, setStep] = useState(() => {
    try { return localStorage.getItem("bast_step") || "tier1"; }
    catch { return "tier1"; }
  });
  const [t1Index, setT1Index] = useState(0);
  const [answersT1, setAnswersT1] = useState({});
  const [multiSelected, setMultiSelected] = useState([]);
  const [effectiveTier1Questions, setEffectiveTier1Questions] = useState(QUESTIONS_TIER1);
  const [tier2Draft, setTier2Draft] = useState("");
  const [tier2Progress, setTier2Progress] = useState(0);
  const [tier2Turn, setTier2Turn] = useState(0);
  const [textDraft, setTextDraft] = useState("");
  const [followUp, setFollowUp] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (loading) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading]);

  useEffect(() => {
    try { localStorage.setItem("bast_messages", JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem("bast_unlocked", unlocked ? "true" : "false"); } catch {}
  }, [unlocked]);

  useEffect(() => {
    try { localStorage.setItem("bast_step", step); } catch {}
  }, [step]);

  const clearHistory = () => {
    setMessages([]);
    setAnswersT1({});
    setMultiSelected([]);
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

  const handleLicenseSubmit = async () => {
    if (!licenseKey.trim()) return;
    setLicenseLoading(true);
    setLicenseError("");
    const valid = await validateLicenseKey(licenseKey);
    if (valid) {
      setUnlocked(true);
      beginTier2();
    } else {
      setLicenseError("That password doesn't appear to be correct. Please check your purchase confirmation email and try again.");
    }
    setLicenseLoading(false);
  };

  const handleLicenseKeyDown = (e) => {
    if (e.key === "Enter") handleLicenseSubmit();
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
    const latest = { ...answersT1, [q.id]: { selected: multiSelected, detail: textDraft } };
    setAnswersT1(latest);
    setMultiSelected([]);
    setTextDraft("");
    if (q.id === "diagnosis") {
      const effective = buildEffectiveTier1Questions(latest.diagnosis);
      setEffectiveTier1Questions(effective);
      advanceT1(latest, effective);
    } else {
      advanceT1(latest);
    }
  };

  const fetchInitialReading = async (latestAnswers, questionsList) => {
    const list = questionsList || effectiveTier1Questions;
    setLoading(true);
    const compiled = compileAnswers(list, latestAnswers);
    const userMsg = {
      role: "user",
      content: `Here is the intake for an Initial Reading:\n\n${compiled}\n\nProvide an Initial Reading based on this intake.`,
      display: compiled,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    try {
      const text = await callAPI(newMessages);
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
      setStep(unlocked ? "post-initial" : "paywall");
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "There was a connection error. Please try again." }]);
    }
    setLoading(false);
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

  // Pick up Tier 1 answers passed in via URL params (e.g. from a landing-page
  // quiz) so a returning visitor doesn't have to answer the same questions
  // twice. Only fires once, on a completely fresh session. The set of
  // required params depends on the diagnosis answer, same as the in-app
  // flow — a diagnosis-focused-only answer means only "diagnosis" (and its
  // detail) will be present at all.
  useEffect(() => {
    if (messages.length > 0 || t1Index > 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (!params.has("diagnosis")) return;

      const diagnosisRaw = params.get("diagnosis") || "";
      const diagnosisSelected = diagnosisRaw.split("||").map(s => s.trim()).filter(Boolean);
      const diagnosisDetail = params.get("diagnosis_detail") || "";
      const diagnosisAnswer = { selected: diagnosisSelected, detail: diagnosisDetail };
      const effective = buildEffectiveTier1Questions(diagnosisAnswer);
      const ids = effective.map(q => q.id);

      if (!ids.every(id => params.has(id))) return;

      const fromUrl = {};
      ids.forEach(id => {
        const raw = params.get(id) || "";
        const selected = raw.split("||").map(s => s.trim()).filter(Boolean);
        const detail = params.get(`${id}_detail`) || "";
        fromUrl[id] = { selected, detail };
      });
      setAnswersT1(fromUrl);
      setEffectiveTier1Questions(effective);
      fetchInitialReading(fromUrl, effective);
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

  const beginTier2 = () => {
    const kickoffMsg = {
      role: "user",
      content: "The person has unlocked the Root Cause Reading and is ready to go deeper. Ask them your first question now — the single most useful thing to understand next, following naturally from the Initial Reading and everything in the intake. Keep the transition conversational, not clinical. End with the required status marker.",
      hidden: true,
    };
    advanceTier2Conversation([...messages, kickoffMsg]);
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
        <QuestionScreen questions={effectiveTier1Questions} index={t1Index} tierLabel="Free Reading" loading={loading} textDraft={textDraft} setTextDraft={setTextDraft} handleTextKeyDown={handleTextKeyDown} multiSelected={multiSelected} toggleMultiSelect1={toggleMultiSelect1} submitT1Multi={submitT1Multi} />
        <style>{`* { box-sizing: border-box; } body { margin: 0; } textarea::placeholder { color: rgba(30,26,22,0.3); }`}</style>
      </div>
    );
  }

  // ---- RENDER: PAYWALL (after Initial Reading, before Tier 2) ----

  if (step === "paywall" && !unlocked) {
    return (
      <div style={{ height: "100vh", overflow: "hidden", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
        <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
        <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef}
          ctaSlot={
            <div style={{ maxWidth: "460px", margin: "0 auto", width: "100%" }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: c.textPrimary, marginBottom: "0.5rem", fontFamily: SANS }}>
                  Go deeper: get your Root Cause Reading
                </div>
                <div style={{ fontSize: "16px", color: c.textSecondary, lineHeight: 1.7 }}>
                  Unlock a real conversation that goes as deep as it needs to — and a complete, no-limit root-cause reading once we've gathered enough to do it justice.
                </div>
              </div>
              <div style={{ background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "10px", padding: "1.25rem" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.textMuted, marginBottom: "0.6rem", fontFamily: SANS }}>
                  Access Password
                </div>
                <input
                  type="password"
                  value={licenseKey}
                  onChange={e => { setLicenseKey(e.target.value); setLicenseError(""); }}
                  onKeyDown={handleLicenseKeyDown}
                  placeholder="Enter your access password"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "16px", fontFamily: SANS, padding: "0.25rem 0" }}
                />
              </div>
              {licenseError && (
                <div style={{ marginTop: "0.75rem", fontSize: "14px", color: "#b94040", lineHeight: 1.6 }}>{licenseError}</div>
              )}
              <button
                onClick={handleLicenseSubmit}
                disabled={!licenseKey.trim() || licenseLoading}
                style={{ width: "100%", marginTop: "1rem", background: licenseKey.trim() && !licenseLoading ? c.accent : c.accentMid, border: "none", borderRadius: "6px", padding: "14px", fontSize: "15px", color: licenseKey.trim() && !licenseLoading ? "#fff" : c.textMuted, cursor: licenseKey.trim() && !licenseLoading ? "pointer" : "default", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em" }}
              >
                {licenseLoading ? "Verifying..." : "Unlock Root Cause Reading \u2192"}
              </button>
              <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "14px", color: c.textMuted, fontFamily: SERIF }}>
                Don't have an access password?{" "}
                <a href="https://zborchster.gumroad.com/l/dxrekr" style={{ color: c.accent, textDecoration: "underline" }}>
                  Purchase access here
                </a>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  // ---- RENDER: POST-INITIAL (already-unlocked users see the reading before continuing) ----

  if (step === "post-initial" && !loading) {
    return (
      <div style={{ height: "100vh", overflow: "hidden", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
        <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
        <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef}
          ctaSlot={
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  onClick={beginTier2}
                  style={{ background: c.accent, border: "none", borderRadius: "6px", padding: "14px 28px", fontSize: "15px", color: "#fff", cursor: "pointer", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em" }}
                >
                  Go Deeper: Get My Root Cause Reading &rarr;
                </button>
              </div>
              <Disclaimer />
            </>
          }
        />
      </div>
    );
  }

  // ---- RENDER: TIER 2 (dynamic, open-ended conversation — plain input,
  // subtle progress indicator, no fixed question card) ----

  if (step === "tier2" && !loading) {
    return (
      <div style={{ height: "100vh", overflow: "hidden", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
        <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
        <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef}
          ctaSlot={
            <>
              <Tier2ProgressBar progress={tier2Progress} />
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
      <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef}
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
