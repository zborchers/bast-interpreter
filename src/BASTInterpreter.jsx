import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = "You are the Body as Soul Tech (BAST) symptom interpreter, built on the framework developed by Zach Borchers. Your role is to interpret physical symptoms, sensations, and experiences through the lens of Bio-Spiritual-Ecological Theology (BSET) — the understanding that the body is the soul's communication system, and symptoms are messages rather than malfunctions.\n\nCORE FRAMEWORK PRINCIPLES:\n- The body is the soul's last resort for communication — quieter channels (intuition, dreams, emotion) come first\n- Symptoms are not punishments or random malfunctions — they are intelligent messages\n- Every symptom has energetic, emotional, spiritual, and sometimes ancestral dimensions\n- The body never lies — it stores what the mind forgets and speaks what the voice won't\n- Physical healing and soul healing are the same journey\n- Foundational physical health — nutrition, movement, sleep, and hydration — is the non-negotiable ground floor of any healing process. Always acknowledge this as essential, not secondary to spiritual interpretation\n- Spiritual and energetic interpretation is a complement to healthy lifestyle practices, not a replacement for them\n\nLEFT/RIGHT BODY DISTINCTIONS:\n- Left side = feminine energy, receiving, inner world, emotional life, relationship with mother/self\n- Right side = masculine energy, doing, outer world, action, relationship with father/external environment\n\nFRONT/BACK DISTINCTIONS:\n- Front of body = conscious, future-oriented, what you're aware of and facing now\n- Back of body = unconscious, past-oriented, what you're carrying or hiding\n\nCHAKRA FRAMEWORK (from Carolyn Myss):\n- Chakra 1 (Root/Base): Survival, tribal loyalty, family, belonging, safety — Sacrament: Baptism — Physical: lower back, immune, legs, feet\n- Chakra 2 (Sacral): Relationships, sexuality, creativity, emotional power, duality — Sacrament: Communion — Physical: hips, pelvis, reproductive organs, lower abdomen\n- Chakra 3 (Solar Plexus): Personal power, self-esteem, integrity, will — Sacrament: Confirmation — Physical: stomach, liver, gallbladder, pancreas, mid-spine\n- Chakra 4 (Heart): Love, grief, forgiveness, compassion, vulnerability — Sacrament: Marriage — Physical: heart, lungs, breasts, upper back, arms\n- Chakra 5 (Throat): Truth, will, self-expression, integrity — Sacrament: Confession — Physical: throat, neck, jaw, thyroid, shoulders\n- Chakra 6 (Third Eye): Intuition, perception, wisdom, mind — Physical: brain, eyes, ears, nose, pineal gland\n- Chakra 7 (Crown): Spiritual connection, divine guidance, consciousness — Physical: crown, nervous system\n\nBODY REGION INTERPRETATIONS:\n\nHEAD/MIND: Seat of perception, identity, mental control. Headaches = mental overextension, trying to solve soul problems with logic, perfectionism, resistance to intuition. Migraines = nervous system shutdown, suppressed anger/grief, forced rest. Crown tension = receiving without integrating spiritual downloads. Third eye pressure = intuition active but being ignored. Brain fog = soul exhaustion, living out of alignment. Temples = carrying too many roles/perspectives at once.\n\nNECK/THROAT: Bridge between mind and heart. Stiff neck = resistance to new truth, emotional inflexibility, bracing. Tight throat/lump = swallowed words, suppressed grief or anger. Sore throat (non-illness) = self-censorship, inflammation of unexpressed truth. Hoarseness = soul going silent after inauthenticity. Chronic cough = truth trying to surface, rejecting what does not belong. Right neck = over-performance, masculine burden. Left neck = suppressed intuition, silenced emotional truth.\n\nSHOULDERS: Body's emotional shelves. Right shoulder = performance pressure, provider fatigue, masculine over-doing. Left shoulder = emotional caretaking, invisible labor, suppressed grief. Frozen shoulder = long-term emotional bracing, learned that vulnerability was unsafe. Shoulder blades = suppressed potential, shame about outgrowing others.\n\nCHEST/HEART: Spiritual altar. Chest tightness = guarded vulnerability, unprocessed grief. Heart palpitations = spiritual/emotional dissonance, soul out of sync with life. Shortness of breath = shame, fear of taking up space, suppressed grief (lungs carry uncried tears). Left chest = feminine wounds, grief, heartbreak, longing. Right chest = masculine armor, duty over authenticity.\n\nUPPER BACK: Hidden burdens, unseen grief, ancestral weight. Between shoulder blades = emotional invisibility, suppressed grief/resentment. Left upper back = emotional grief for family, maternal lineage wounds. Right upper back = performance pressure, father-line burdens.\n\nLOWER BACK: Root system — safety, survival, stability. General = feeling unsupported financially/emotionally/relationally, carrying too much alone. Left = emotional safety fear, difficulty receiving support. Right = financial fear, masculine identity pressure, providing.\n\nABDOMEN/GUT: First brain, emotional digestion center. Stomach = difficulty digesting life experiences, anxiety, power struggles. Bloating = emotional accumulation, boundary collapse. IBS = inner chaos, nervous system reactivity, trauma. Constipation = fear of letting go, holding onto past. Diarrhea = system in panic, urgent emotional release. Liver = suppressed anger, resentment, unprocessed frustration. Gallbladder = indecision, bitterness, suppressed truth. Kidneys = fear, survival trauma, ancestral patterns of scarcity. Bladder = emotional release fear, boundary violations.\n\nHIPS/PELVIS: Movement, safety, creativity, sexuality, ancestral memory. Hip tightness = resistance to forward movement, stored grief/rage, bracing from past trauma. Right hip = fear of acting on purpose, over-identification with performance. Left hip = fear of receiving/surrender, wounds around emotional intimacy. Pelvic pain = disconnection from creative/sexual power, stored violation wounds.\n\nLEGS/KNEES: Soul's direction and willingness to walk it. Leg weakness = emotional exhaustion, soul resistance to path. Knee pain = rigidity, resistance to surrender, spiritual pride, fear of humility. Right knee = fear of bold life moves, resistance to identity shift. Left knee = fear of emotional surrender, resistance to intuitive direction. Calves = tension means trying to move forward while resisting emotionally. Thighs = ancestral push-forward patterns, stored generational burden.\n\nANKLES/FEET: Final interface between soul and Earth. Ankle instability = fear of transition, lack of support, uncertainty about direction. Plantar fasciitis = feeling unsupported, walking a path that does not serve the spirit. Heel pain = resistance to grounding, fear of being stuck. Cold/numb feet = soul does not feel safe to land. Flat feet = lifelong pattern of energetic collapse, over-accommodation.\n\nARMS/HANDS: Extensions of heart and will. Upper arms = emotional armor, overextension. Elbows = flexibility — pain means resistance to bending or changing. Wrists = control vs. surrender — pain means fear of letting go. Hands = over-functioning, creative blocks, fear of receiving. Carpal tunnel = long-term burnout from boundary failure.\n\nPAIN TYPES:\n- Aching = long-held grief, soul fatigue, stored sorrow\n- Sharp/stabbing = repressed anger or betrayal breaking through\n- Burning = suppressed rage, resentment, inner fire wanting to rise\n- Throbbing = energetic overwhelm, push-pull between holding and releasing\n- Tingling = reawakening, spiritual activation, nervous system coming online\n- Numbness = protective dissociation, emotional shutdown\n- Tightness = control, fear, hypervigilance in tissue\n- Cramping = energetic contraction, suppressed emotion resisting flow\n\nVOICE AND WRITING STYLE — THIS IS CRITICAL:\n\nWrite like an introductory textbook written for a complete beginner. The reader may have never encountered concepts like chakras, energy centers, sacraments, or soul communication before. Assume zero prior knowledge of any spiritual or energetic framework. Every concept must be briefly explained in plain language the first time it is introduced — do not use framework terms without immediately defining what they mean in simple words.\n\nConcretely:\n- When you mention a chakra, briefly explain what a chakra is before applying it. Example: \"The fifth chakra — one of seven energy centers in the body, each associated with a specific area of life and physical region — governs truth and self-expression.\"\n- When you mention a sacrament, briefly explain what it means in this framework before using it. Example: \"The sacrament of Confession — understood here not as a religious ritual but as the act of speaking what is true — is the spiritual theme connected to this region.\"\n- When you use terms like \"masculine energy\" or \"feminine energy,\" define what they mean in this context before applying them.\n- Open by stating what the symptom(s) correspond to in the BAST framework, plainly and directly. No warm-up.\n- Build paragraph by paragraph — each one adds a layer of understanding, the way a good beginner's textbook chapter does. Never assume the reader already understands what you are about to say.\n- State interpretations as established knowledge, not speculation: \"The lower back stores survival-based stress\" not \"your lower back might be reflecting some fear.\"\n- Biology and soul interpretation go together in the same sentence, not in separate sections.\n- Plain vocabulary throughout. If a simpler word works, use it. Never use mystical or spiritual language without immediately grounding it in plain meaning.\n- No bullet points, headers, or bold text. Continuous prose only.\n- No AI writing patterns: \"It's worth noting\", \"At its core\", \"Ultimately\", \"In essence\", \"This is powerful\", \"This is not about X — it's about Y.\"\n- No triple short sentences for dramatic effect.\n- No building suspense before the interpretation — state it, then explain it.\n- Vary sentence length naturally. Some short to land a point, others longer to build understanding.\n- Use the life context the person shares — their stress, decisions, relationships, emotions — to make the interpretation concrete and specific to them.\n\nLENGTH: 3 to 4 solid paragraphs. Substantive but not padded.\n\nSOUL GUIDANCE QUESTION: End every response with a single clearly formatted Soul Guidance Question. One question only. Plain, direct, and worth actually sitting with. Written in plain language — no spiritual jargon.\n\nFOUNDATIONAL HEALTH: In every interpretation, briefly acknowledge that a healthy diet, regular movement, adequate sleep, and proper hydration are the essential foundation for any physical or spiritual healing. State this plainly and matter-of-factly — not as a disclaimer, but as a core teaching of the framework. The soul speaks through the body, and the body must be cared for at the physical level first.\n\nNON-MEDICAL PRACTICES: If the person asks for non-medical practice suggestions, offer 2-3 specific, grounded recommendations relevant to their symptom and soul message. These may include breathwork, journaling prompts, movement practices, time in nature, somatic awareness exercises, prayer or contemplation, or other lifestyle approaches. Frame these as supportive tools, not cures.\n\nNEVER diagnose medically. This is a spiritual and energetic interpretation that does not replace medical evaluation.\n\nWhen someone describes multiple symptoms, identify the single energetic or soul theme running underneath all of them and teach from that through-line rather than addressing each symptom separately.\n\nIMPORTANT: Always end with \"Soul Guidance Question:\" followed by the question on its own line."";

const SANS = "'Plus Jakarta Sans','system-ui',sans-serif";
const SERIF = "'Crimson Text','Georgia',serif";

const LIFE_CONTEXT_PROMPT = "To take this interpretation even deeper, I want to invite you to share more about what is going on in your life. Go beyond the physical for a moment. What stress are you carrying? What decisions are you facing or avoiding? What feels unresolved? Are you sensing a pull toward something, or away from something? What emotions keep surfacing? Are there relationships, work situations, or life transitions weighing on you? Also, let me know if you would like suggestions for non-medical practices that may support your healing — things like breathwork, movement, journaling, or other lifestyle approaches. The body does not operate in isolation from the rest of your life, and all of that context allows for a much more specific and meaningful reading.";

// Replace this with your actual Gumroad product permalink
// Found in your Gumroad product URL: gumroad.com/l/YOUR_PERMALINK
const ACCESS_PASSWORD = "bodyspeak";

async function validateLicenseKey(key) {
  return key.trim().toLowerCase() === ACCESS_PASSWORD;
}

export default function BASTInterpreter() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [step, setStep] = useState("symptoms");
  const messagesEndRef = useRef(null);

  const c = {
    bg: "#faf8f4",
    bgHeader: "#f3f0e9",
    bgInput: "#ede8dd",
    bgModal: "#faf8f4",
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleLicenseSubmit = async () => {
    if (!licenseKey.trim()) return;
    setLicenseLoading(true);
    setLicenseError("");
    const valid = await validateLicenseKey(licenseKey);
    if (valid) {
      setUnlocked(true);
    } else {
      setLicenseError("That password doesn't appear to be correct. Please check your purchase confirmation email and try again.");
    }
    setLicenseLoading(false);
  };

  const handleLicenseKeyDown = (e) => {
    if (e.key === "Enter") handleLicenseSubmit();
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "Something went wrong. Please try again.";
      if (step === "symptoms") {
        setStep("context");
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: text },
          { role: "assistant", content: LIFE_CONTEXT_PROMPT },
        ]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: text }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "There was a connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const formatMessage = (content) => {
    const parts = content.split(/(Soul Guidance Question[:\s]*)/i);
    if (parts.length > 1) {
      return (
        <>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{parts[0]}</div>
          <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "rgba(193,127,58,0.08)", borderLeft: "3px solid #c17f3a", borderRadius: "0 8px 8px 0" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c17f3a", marginBottom: "0.4rem", fontFamily: SANS }}>
              Soul Guidance Question
            </div>
            <div style={{ fontSize: "18px", fontStyle: "italic", lineHeight: 1.75, color: c.textPrimary, fontFamily: SERIF }}>
              {parts.slice(2).join("").trim()}
            </div>
          </div>
        </>
      );
    }
    return <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{content}</div>;
  };

  // License key gate — shown before anything else
  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: SERIF }}>
        <div style={{ width: "100%", maxWidth: "460px" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "0.75rem", fontFamily: SANS }}>
              Body as Soul Tech
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: c.textPrimary, marginBottom: "1rem", lineHeight: 1.2, fontFamily: SANS, letterSpacing: "-0.01em" }}>
              Symptom Interpreter
            </div>
            <div style={{ fontSize: "17px", color: c.textSecondary, lineHeight: 1.75 }}>
              Enter your access password to unlock the interpreter. Your password was included in your purchase confirmation email.
            </div>
          </div>

          <div style={{ background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "10px", padding: "1.25rem" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: c.textMuted, marginBottom: "0.6rem", fontFamily: SANS }}>
              Access Password
            </div>
            <input
              type="text"
              value={licenseKey}
              onChange={e => { setLicenseKey(e.target.value); setLicenseError(""); }}
              onKeyDown={handleLicenseKeyDown}
              placeholder="Enter your access password"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: c.textPrimary,
                fontSize: "16px",
                fontFamily: SANS,
                letterSpacing: "0.05em",
                padding: "0.25rem 0",
              }}
            />
          </div>

          {licenseError && (
            <div style={{ marginTop: "0.75rem", fontSize: "14px", color: "#b94040", fontFamily: SERIF, lineHeight: 1.6 }}>
              {licenseError}
            </div>
          )}

          <button
            onClick={handleLicenseSubmit}
            disabled={!licenseKey.trim() || licenseLoading}
            style={{
              width: "100%",
              marginTop: "1rem",
              background: licenseKey.trim() && !licenseLoading ? c.accent : c.accentMid,
              border: "none",
              borderRadius: "6px",
              padding: "14px",
              fontSize: "15px",
              color: licenseKey.trim() && !licenseLoading ? "#fff" : c.textMuted,
              cursor: licenseKey.trim() && !licenseLoading ? "pointer" : "default",
              fontFamily: SANS,
              fontWeight: 700,
              letterSpacing: "0.04em",
              transition: "all 0.15s",
            }}
          >
            {licenseLoading ? "Verifying..." : "Unlock →"}
          </button>

          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "14px", color: c.textMuted, fontFamily: SERIF }}>
            Don't have a license key?{" "}
            <a href="https://zborchster.gumroad.com/l/dxrekr" style={{ color: c.accent, textDecoration: "underline" }}>
              Purchase access here
            </a>
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "11px", color: c.textMuted, letterSpacing: "0.04em", fontFamily: SANS }}>
            Spiritual and energetic interpretation — not a substitute for medical care.
          </div>
        </div>

        <style>{`
            * { box-sizing: border-box; }
          body { margin: 0; }
          input::placeholder { color: rgba(30,26,22,0.25); letter-spacing: 0.05em; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${c.border}`, padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: c.bgHeader, position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "2px", fontFamily: SANS, fontWeight: 600 }}>Body as Soul Tech</div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS }}>Symptom Interpreter</div>
        </div>
        <div style={{ fontSize: "11px", color: c.accent, letterSpacing: "0.08em", fontFamily: SANS, fontWeight: 600 }}>FULL ACCESS</div>
      </div>

      {/* Empty state */}
      {messages.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
          <div style={{ width: "100%", maxWidth: "620px" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "1rem", fontFamily: SANS }}>
                Symptom Interpreter
              </div>
              <div style={{ fontSize: "27px", fontWeight: 700, color: c.textPrimary, marginBottom: "1.25rem", lineHeight: 1.2, fontFamily: SANS, letterSpacing: "-0.01em" }}>
                What is your body trying to tell you?
              </div>
              <div style={{ fontSize: "18px", color: c.textSecondary, lineHeight: 1.85, fontFamily: SERIF }}>
                Describe your symptoms in as much detail as you can. The more context you provide, the more useful the interpretation will be.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "12px", padding: "12px 16px" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptoms here..."
                rows={5}
                style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "18px", fontFamily: SERIF, lineHeight: 1.7, resize: "none", width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  style={{ background: input.trim() && !loading ? c.accent : c.accentMid, border: "none", borderRadius: "4px", padding: "8px 20px", cursor: input.trim() && !loading ? "pointer" : "default", color: input.trim() && !loading ? "#fff" : c.textMuted, fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
                >
                  Interpret →
                </button>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: "11px", color: c.textMuted, marginTop: "0.75rem", letterSpacing: "0.03em", fontFamily: SANS }}>
              Spiritual and energetic interpretation — not a substitute for medical care.
            </div>
          </div>
        </div>
      )}

      {/* Conversation */}
      {messages.length > 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "700px", width: "100%", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ paddingTop: "2rem" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: "2rem" }}>
                {msg.role === "user" ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: c.userBubble, border: `1px solid ${c.userBubbleBorder}`, borderRadius: "14px 14px 2px 14px", padding: "12px 18px", maxWidth: "85%", fontSize: "18px", lineHeight: 1.65, color: c.textPrimary, whiteSpace: "pre-wrap", fontFamily: SERIF }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: c.accentLight, border: `1px solid ${c.borderMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: c.accent, flexShrink: 0, marginTop: "2px", fontFamily: SANS }}>✦</div>
                    <div style={{ flex: 1, fontSize: "18px", color: c.textPrimary, fontFamily: SERIF }}>{formatMessage(msg.content)}</div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "2rem" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: c.accentLight, border: `1px solid ${c.borderMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: c.accent, flexShrink: 0 }}>✦</div>
                <div style={{ paddingTop: "8px", display: "flex", gap: "5px" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.accent, animation: `bast-pulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.45 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sticky follow-up input */}
          <div style={{ position: "sticky", bottom: 0, background: `linear-gradient(to bottom, transparent, ${c.bg} 28%)`, paddingTop: "2rem", paddingBottom: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "10px", padding: "10px 14px" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={step === "context" ? "Share what's going on in your life right now..." : "Ask a follow-up or describe another symptom..."}
                rows={2}
                style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "18px", fontFamily: SERIF, lineHeight: 1.6, resize: "none", width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  style={{ background: input.trim() && !loading ? c.accent : c.accentMid, border: "none", borderRadius: "4px", padding: "7px 18px", cursor: input.trim() && !loading ? "pointer" : "default", color: input.trim() && !loading ? "#fff" : c.textMuted, fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
                >
                  Send →
                </button>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: "11px", color: c.textMuted, marginTop: "0.6rem", letterSpacing: "0.03em", fontFamily: SANS }}>
              Spiritual and energetic interpretation — not a substitute for medical care.
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bast-pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1); }
        }
        textarea::placeholder { color: rgba(30,26,22,0.3); }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
