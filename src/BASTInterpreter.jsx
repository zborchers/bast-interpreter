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
  const parts = content.split(/(Soul Guidance Question[:\s]*)/i);
  if (parts.length > 1) {
    return (
      <>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{parts[0]}</div>
        <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "rgba(193,127,58,0.08)", borderLeft: "3px solid #c17f3a", borderRadius: "0 8px 8px 0" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c17f3a", marginBottom: "0.4rem", fontFamily: SANS }}>
            Soul Guidance Question
          </div>
          <div style={{ fontSize: "18px", fontStyle: "italic", lineHeight: 1.75, color: "#1e1a16", fontFamily: SERIF }}>
            {parts.slice(2).join("").trim()}
          </div>
        </div>
      </>
    );
  }
  return <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{content}</div>;
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
      Spiritual and energetic interpretation — not a substitute for medical care.
    </div>
  );
}

// ---- QUESTION WIZARD SCREEN (also hoisted — this is the one that was
// causing the reversed-typing bug in the free-text answers) ----

function QuestionScreen({ questions, index, tierLabel, loading, textDraft, setTextDraft, handleTextKeyDown, selectT1, submitT1Text, submitT2Text, skipT2 }) {
  const q = questions[index];
  const isSelect = q.type === "select";

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
          {q.optional && (
            <div style={{ fontSize: "12px", color: c.accentPop, marginTop: "0.5rem", fontFamily: SANS, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Optional — skip if unsure
            </div>
          )}
        </div>

        {isSelect ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
            {q.options.map(opt => (
              <button
                key={opt}
                onClick={() => selectT1(opt)}
                disabled={loading}
                style={{ background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "10px", padding: "12px 20px", fontSize: "16px", color: c.textPrimary, cursor: loading ? "default" : "pointer", fontFamily: SERIF, transition: "all 0.15s" }}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div>
            {q.suggestions && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "0.9rem" }}>
                {q.suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => setTextDraft(s)}
                    disabled={loading}
                    style={{ background: "transparent", border: `1px dashed ${c.borderMid}`, borderRadius: "999px", padding: "7px 14px", fontSize: "13px", color: c.textSecondary, cursor: loading ? "default" : "pointer", fontFamily: SANS, transition: "all 0.15s" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "12px", padding: "12px 16px" }}>
              <textarea
                value={textDraft}
                onChange={e => setTextDraft(e.target.value)}
                onKeyDown={handleTextKeyDown(tierLabel === "Free Reading" ? submitT1Text : submitT2Text)}
                placeholder="Tap a suggestion above, or type your own answer here..."
                rows={4}
                autoFocus
                style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "18px", fontFamily: SERIF, lineHeight: 1.7, resize: "none", width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {q.optional ? (
                  <button onClick={skipT2} disabled={loading} style={{ background: "transparent", border: "none", color: c.textMuted, fontSize: "13px", cursor: "pointer", fontFamily: SANS, textDecoration: "underline" }}>
                    Skip this question
                  </button>
                ) : <div />}
                <button
                  onClick={tierLabel === "Free Reading" ? submitT1Text : submitT2Text}
                disabled={loading}
                style={{ background: loading ? c.accentMid : c.accent, border: "none", borderRadius: "4px", padding: "8px 20px", cursor: loading ? "default" : "pointer", color: loading ? c.textMuted : "#fff", fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
              >
                {loading ? "Reading…" : "Next \u2192"}
              </button>
            </div>
          </div>
        </div>
        )}
        <Disclaimer />
      </div>
    </div>
  );
}

// ---- READING TRANSCRIPT (also hoisted, same reason) ----

function Transcript({ messages, loading, messagesEndRef, ctaSlot }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "700px", width: "100%", margin: "0 auto", padding: "0 1.5rem" }}>
      <div style={{ paddingTop: "2rem" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "2rem" }}>
            {msg.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: c.userBubble, border: `1px solid ${c.userBubbleBorder}`, borderRadius: "14px 14px 2px 14px", padding: "12px 18px", maxWidth: "85%", fontSize: "15px", lineHeight: 1.65, color: c.textSecondary, whiteSpace: "pre-wrap", fontFamily: SERIF }}>
                  {msg.content}
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
        <div ref={messagesEndRef} />
      </div>

      <div style={{ position: "sticky", bottom: 0, background: `linear-gradient(to bottom, transparent, ${c.bg} 28%)`, paddingTop: "2rem", paddingBottom: "1.25rem" }}>
        {ctaSlot}
      </div>
    </div>
  );
}

// ---- INTAKE QUESTIONS -------------------------------------------------

const QUESTIONS_TIER1 = [
  {
    id: "region",
    type: "select",
    q: "Where in the body is this happening?",
    options: [
      "Head / Mind", "Neck / Throat", "Shoulders", "Chest / Heart",
      "Upper Back", "Lower Back", "Abdomen / Gut", "Hips / Pelvis",
      "Legs / Knees", "Ankles / Feet", "Arms / Hands", "Somewhere else",
    ],
  },
  {
    id: "side",
    type: "select",
    q: "Is it more on the left side, the right side, centered, or on both sides?",
    options: ["Left side", "Right side", "Centered", "Both sides"],
  },
  {
    id: "plane",
    type: "select",
    q: "Do you feel it more toward the front, more toward the back, or both at once?",
    options: ["Front", "Back", "Both at once"],
  },
  {
    id: "quality",
    type: "select",
    q: "How would you describe it?",
    options: ["Sharp", "Dull ache", "Burning", "Tight", "Throbbing", "Numb", "Cramping", "Tingling"],
  },
  {
    id: "pattern",
    type: "select",
    q: "Is this the first time you've had this, does it come and go, or is it constant / ongoing?",
    options: ["First time", "Comes and goes", "Constant / ongoing"],
  },
  {
    id: "context",
    type: "text",
    q: "What's actually going on in your life right now — what's been on your mind or on your plate?",
  },
];

const QUESTIONS_TIER2 = [
  {
    id: "power_drain",
    type: "text",
    q: "Is there a person, job, or commitment right now where you keep agreeing to something that actually drains you?",
    hint: "Why we ask: Your body often shows the cost of energy going somewhere it shouldn't. This helps us find where that's happening for you.",
    tags: ["work", "relationship", "caregiving", "burden"],
    suggestions: [
      "A work commitment I keep saying yes to",
      "A family obligation I can't say no to",
      "A relationship that always leaves me depleted",
      "A responsibility I took on but never wanted",
    ],
  },
  {
    id: "long_carry",
    type: "text",
    q: "What's something you've been dealing with — a responsibility, a worry, a relationship — for way longer than feels fair or sustainable?",
    hint: "Why we ask: Symptoms tend to show up exactly where something's been carried too long. This helps us find the connection.",
    tags: ["chronic", "long-standing", "burden", "relationship", "financial"],
    suggestions: [
      "A stressful job I've stayed in too long",
      "A strained relationship I haven't addressed",
      "A financial burden I've been carrying alone",
      "A caregiving role that never gets a break",
    ],
  },
  {
    id: "onset",
    type: "text",
    q: "When did this first start, or when did it get noticeably worse? What was happening in your life around that time?",
    tags: ["new", "recent onset"],
    suggestions: [
      "A few months ago, around a major life change",
      "It's been building slowly for years",
      "Right after a stressful period at work",
      "Not sure exactly when it started",
    ],
  },
  {
    id: "recurrence",
    type: "text",
    q: "Have you had other health issues in the past that seemed to show up around similar situations or stress — even in a completely different part of your body?",
    tags: ["cyclical", "recurring", "chronic"],
    suggestions: [
      "Yes, something similar shows up during stressful times",
      "No, this feels new for me",
      "This has shown up in different ways over the years",
    ],
  },
  {
    id: "body_message",
    type: "text",
    q: "If you had to guess, what do you think your body is trying to get you to notice or change?",
    tags: [],
    suggestions: [
      "To slow down",
      "To stop ignoring how I actually feel",
      "To set a boundary I've been avoiding",
      "To let go of something I've outgrown",
    ],
  },
  {
    id: "shadow",
    type: "text",
    q: "Is there a reason, even a small or uncomfortable one, that some part of you isn't ready to change this yet?",
    hint: "Why we ask: This isn't about blame — sometimes we hold onto a pattern because it's protecting us from something else. Naming that is often where real movement starts.",
    tags: ["fear of change", "protection", "boundaries"],
    suggestions: [
      "It feels safer to stay how things are",
      "I'm scared of what change might cost me",
      "I'm not sure what I'd do without this pattern",
    ],
  },
  {
    id: "ancestral",
    type: "text",
    q: "Does anyone else in your family deal with this same health issue, or a similar emotional pattern?",
    optional: true,
    suggestions: [
      "Yes, a parent dealt with something similar",
      "Not that I know of",
      "There's a pattern of this in my family",
    ],
  },
  {
    id: "energy_allocation",
    type: "text",
    q: "Think about a normal day. Where does most of your time and energy actually go — and is that where you'd want it to go if you could choose freely?",
    tags: ["work", "caregiving", "burden"],
    suggestions: [
      "Work takes almost everything I have",
      "Taking care of others, with little left for me",
      "Managing stress and putting out fires",
      "Honestly, I'm not sure where it goes",
    ],
  },
  {
    id: "forward",
    type: "text",
    q: "Setting medical treatment aside for a moment — what do you think would need to change in your life or mindset for this to actually get better?",
    suggestions: [
      "Setting a boundary I've been avoiding",
      "Making a change I've been putting off",
      "Letting go of something I've outgrown",
      "Actually letting myself rest",
    ],
  },
];

function compileAnswers(questions, answers) {
  return questions
    .map(q => {
      const val = (answers[q.id] || "").trim();
      return `${q.q}\n${val ? val : "(skipped)"}`;
    })
    .join("\n\n");
}

// ---- TIER 2 RELEVANCE ORDERING ----
// Reorders the middle Tier 2 questions based on signals pulled from the
// Tier 1 answers, so the most relevant follow-ups come first. "ancestral"
// (optional) and "forward" (closing/synthesis question) always stay at
// the end, in that order.

const REGION_SIGNAL_TAGS = {
  "Head / Mind": ["control", "worry"],
  "Neck / Throat": ["expression", "voice"],
  "Shoulders": ["burden"],
  "Chest / Heart": ["relationship", "grief"],
  "Upper Back": ["burden"],
  "Lower Back": ["financial", "burden"],
  "Abdomen / Gut": ["protection", "boundaries"],
  "Hips / Pelvis": ["relationship"],
  "Legs / Knees": ["fear of change"],
  "Ankles / Feet": ["fear of change"],
  "Arms / Hands": ["burden"],
};

const PATTERN_SIGNAL_TAGS = {
  "First time": ["new", "recent onset"],
  "Comes and goes": ["cyclical", "recurring"],
  "Constant / ongoing": ["chronic", "long-standing"],
};

const CONTEXT_KEYWORD_TAGS = {
  work: ["work", "job", "boss", "career", "deadline", "office"],
  relationship: ["relationship", "partner", "spouse", "marriage", "divorce", "boyfriend", "girlfriend", "husband", "wife", "family", "mother", "father", "friend"],
  caregiving: ["kids", "children", "caregiv", "parent", "son", "daughter"],
  financial: ["money", "debt", "bills", "financial", "afford"],
};

function buildTier1Signals(answersT1) {
  const signals = new Set();
  (REGION_SIGNAL_TAGS[answersT1.region] || []).forEach(t => signals.add(t));
  (PATTERN_SIGNAL_TAGS[answersT1.pattern] || []).forEach(t => signals.add(t));
  const context = (answersT1.context || "").toLowerCase();
  Object.entries(CONTEXT_KEYWORD_TAGS).forEach(([tag, words]) => {
    if (words.some(w => context.includes(w))) signals.add(tag);
  });
  return signals;
}

function orderTier2Questions(answersT1) {
  const signals = buildTier1Signals(answersT1);
  const fixedTailIds = ["ancestral", "forward"];
  const reorderable = QUESTIONS_TIER2.filter(q => !fixedTailIds.includes(q.id));
  const tail = QUESTIONS_TIER2.filter(q => fixedTailIds.includes(q.id));

  const scored = reorderable.map((q, i) => {
    const tags = q.tags || [];
    const score = tags.reduce((sum, t) => sum + (signals.has(t) ? 1 : 0), 0);
    return { q, i, score };
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);

  return [...scored.map(s => s.q), ...tail];
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
      const ids = QUESTIONS_TIER1.map(q => q.id);
      return !hasSavedSession && ids.every(id => params.get(id));
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
  const [t2Index, setT2Index] = useState(0);
  const [answersT1, setAnswersT1] = useState({});
  const [answersT2, setAnswersT2] = useState({});
  const [tier2Questions, setTier2Questions] = useState(QUESTIONS_TIER2);
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
    setAnswersT2({});
    setT1Index(0);
    setT2Index(0);
    setTier2Questions(QUESTIONS_TIER2);
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
      setStep("tier2");
    } else {
      setLicenseError("That password doesn't appear to be correct. Please check your purchase confirmation email and try again.");
    }
    setLicenseLoading(false);
  };

  const handleLicenseKeyDown = (e) => {
    if (e.key === "Enter") handleLicenseSubmit();
  };

  async function callAPI(newMessages) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: newMessages,
      }),
    });
    const data = await response.json();
    return data.content?.find(b => b.type === "text")?.text
      || "Something went wrong. Please try again.";
  }

  // ---- TIER 1 SELECT/TEXT ANSWER HANDLING ----

  const selectT1 = (option) => {
    const q = QUESTIONS_TIER1[t1Index];
    const latest = { ...answersT1, [q.id]: option };
    setAnswersT1(latest);
    advanceT1(latest);
  };

  const submitT1Text = () => {
    const q = QUESTIONS_TIER1[t1Index];
    const latest = { ...answersT1, [q.id]: textDraft };
    setAnswersT1(latest);
    setTextDraft("");
    advanceT1(latest);
  };

  const fetchInitialReading = async (latestAnswers) => {
    setLoading(true);
    setTier2Questions(orderTier2Questions(latestAnswers));
    const compiled = compileAnswers(QUESTIONS_TIER1, latestAnswers);
    const userMsg = {
      role: "user",
      content: `Here is the intake for an Initial Reading:\n\n${compiled}\n\nProvide an Initial Reading based on this intake.`,
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

  const advanceT1 = (latestAnswers) => {
    if (t1Index < QUESTIONS_TIER1.length - 1) {
      setT1Index(t1Index + 1);
      return;
    }
    // Tier 1 complete — request Initial Reading
    fetchInitialReading(latestAnswers);
  };

  // Pick up Tier 1 answers passed in via URL params (e.g. from a landing-page
  // quiz) so a returning visitor doesn't have to answer the same six
  // questions twice. Only fires once, on a completely fresh session.
  useEffect(() => {
    if (messages.length > 0 || t1Index > 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ids = QUESTIONS_TIER1.map(q => q.id);
      if (ids.every(id => params.get(id))) {
        const fromUrl = {};
        ids.forEach(id => { fromUrl[id] = params.get(id); });
        setAnswersT1(fromUrl);
        fetchInitialReading(fromUrl);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- TIER 2 SELECT/TEXT ANSWER HANDLING ----

  const submitT2Text = () => {
    const q = tier2Questions[t2Index];
    const latest = { ...answersT2, [q.id]: textDraft };
    setAnswersT2(latest);
    setTextDraft("");
    handleTier2Answer(q, textDraft, latest);
  };

  const skipT2 = () => {
    const q = tier2Questions[t2Index];
    const latest = { ...answersT2 };
    const isLast = t2Index === tier2Questions.length - 1;
    if (isLast) {
      handleTier2Answer(q, "", latest);
    } else {
      // Nothing was answered, so there's nothing to reflect on — just move on.
      setT2Index(t2Index + 1);
    }
  };

  const handleTier2Answer = async (q, answerText, latestAnswers) => {
    const isLast = t2Index === tier2Questions.length - 1;
    setLoading(true);

    if (isLast) {
      // Final Tier 2 answer — request the full Root Cause Reading synthesis.
      const compiled = compileAnswers(tier2Questions, latestAnswers);
      const userMsg = {
        role: "user",
        content: `The person would like to go deeper. Here are additional intake answers for a full Root Cause Reading:\n\n${compiled}\n\nUsing everything shared so far — the original symptom details and this deeper context — provide a complete Root Cause Reading using the full Deep Reading sequence: location, power, shadow, and synthesized soul message.`,
      };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      try {
        const text = await callAPI(newMessages);
        setMessages(prev => [...prev, { role: "assistant", content: text }]);
        setStep("chat");
      } catch {
        setMessages(prev => [...prev, { role: "assistant", content: "There was a connection error. Please try again." }]);
      }
    } else {
      // Any other Tier 2 answer — request a brief reflection on just this one.
      const trimmed = answerText.trim();
      const userMsg = {
        role: "user",
        content: `${q.q}\n${trimmed ? trimmed : "(skipped)"}\n\nOffer a brief reflection (2-4 sentences) connecting this specific answer to the pattern already established. Don't provide the full synthesis yet — more questions are coming.`,
      };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      try {
        const text = await callAPI(newMessages);
        setMessages(prev => [...prev, { role: "assistant", content: text }]);
        setStep("tier2-response");
      } catch {
        setMessages(prev => [...prev, { role: "assistant", content: "There was a connection error. Please try again." }]);
      }
    }
    setLoading(false);
  };

  const continueTier2 = () => {
    setT2Index(t2Index + 1);
    setStep("tier2");
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
        <QuestionScreen questions={QUESTIONS_TIER1} index={t1Index} tierLabel="Free Reading" loading={loading} textDraft={textDraft} setTextDraft={setTextDraft} handleTextKeyDown={handleTextKeyDown} selectT1={selectT1} submitT1Text={submitT1Text} submitT2Text={submitT2Text} skipT2={skipT2} />
        <style>{`* { box-sizing: border-box; } body { margin: 0; } textarea::placeholder { color: rgba(30,26,22,0.3); }`}</style>
      </div>
    );
  }

  // ---- RENDER: PAYWALL (after Initial Reading, before Tier 2) ----

  if (step === "paywall" && !unlocked) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
        <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
        <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef} ctaSlot={null} />
        <div style={{ maxWidth: "460px", margin: "0 auto 2.5rem", width: "100%", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: c.textPrimary, marginBottom: "0.5rem", fontFamily: SANS }}>
              Go deeper: get your Root Cause Reading
            </div>
            <div style={{ fontSize: "16px", color: c.textSecondary, lineHeight: 1.7 }}>
              Answer 9 more questions and unlock the full root-cause interpretation — the energetic pattern actually driving this symptom.
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
      </div>
    );
  }

  // ---- RENDER: POST-INITIAL (already-unlocked users see the reading before continuing) ----

  if (step === "post-initial" && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
        <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
        <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef}
          ctaSlot={
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  onClick={() => setStep("tier2")}
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

  // ---- RENDER: TIER 2 RESPONSE (short reflection shown between questions) ----

  if (step === "tier2-response" && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
        <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
        <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef}
          ctaSlot={
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  onClick={continueTier2}
                  style={{ background: c.accent, border: "none", borderRadius: "6px", padding: "14px 28px", fontSize: "15px", color: "#fff", cursor: "pointer", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em" }}
                >
                  Next Question &rarr;
                </button>
              </div>
              <Disclaimer />
            </>
          }
        />
      </div>
    );
  }

  // ---- RENDER: TIER 2 WIZARD ----

  if (step === "tier2" && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
        <Header messages={messages} t1Index={t1Index} clearHistory={clearHistory} />
        <QuestionScreen questions={tier2Questions} index={t2Index} tierLabel="Root Cause" loading={loading} textDraft={textDraft} setTextDraft={setTextDraft} handleTextKeyDown={handleTextKeyDown} selectT1={selectT1} submitT1Text={submitT1Text} submitT2Text={submitT2Text} skipT2={skipT2} />
        <style>{`* { box-sizing: border-box; } body { margin: 0; } textarea::placeholder { color: rgba(30,26,22,0.3); }`}</style>
      </div>
    );
  }

  // ---- RENDER: CHAT (post Root Cause Reading, or mid-request loading state) ----

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>
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
