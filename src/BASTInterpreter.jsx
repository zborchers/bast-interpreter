import { useState, useRef, useEffect } from "react";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

const SANS = "'Plus Jakarta Sans','system-ui',sans-serif";
const SERIF = "'Crimson Text','Georgia',serif";
const LIFE_CONTEXT_PROMPT = "To take this interpretation even deeper, I want to invite you to share more about what is going on in your life. Go beyond the physical for a moment. What stress are you carrying? What decisions are you facing or avoiding? What feels unresolved? Are you sensing a pull toward something, or away from something? What emotions keep surfacing? Are there relationships, work situations, or life transitions weighing on you? Also, let me know if you would like suggestions for non-medical practices that may support your healing - things like breathwork, movement, journaling, or other lifestyle approaches. The body does not operate in isolation from the rest of your life, and all of that context allows for a much more specific and meaningful reading.";
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
    if (loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading]);

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
        headers: { "Content-Type": "application/json" },
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
            <div style={{ fontSize: "18px", fontStyle: "italic", lineHeight: 1.75, color: "#1e1a16", fontFamily: SERIF }}>
              {parts.slice(2).join("").trim()}
            </div>
          </div>
        </>
      );
    }
    return <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{content}</div>;
  };

  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: SERIF }}>
        <div style={{ width: "100%", maxWidth: "460px" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#2d5a3d", marginBottom: "0.75rem", fontFamily: SANS }}>
              Body as Soul Tech
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "#1e1a16", marginBottom: "1rem", lineHeight: 1.2, fontFamily: SANS, letterSpacing: "-0.01em" }}>
              Symptom Interpreter
            </div>
            <div style={{ fontSize: "17px", color: "#5c5147", lineHeight: 1.75 }}>
              Enter your access password to unlock the interpreter. Your password was included in your purchase confirmation email.
            </div>
          </div>

          <div style={{ background: "#ede8dd", border: "1px solid rgba(100,80,60,0.18)", borderRadius: "10px", padding: "1.25rem" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(30,26,22,0.38)", marginBottom: "0.6rem", fontFamily: SANS }}>
              Access Password
            </div>
            <input
              type="password"
              value={licenseKey}
              onChange={e => { setLicenseKey(e.target.value); setLicenseError(""); }}
              onKeyDown={handleLicenseKeyDown}
              placeholder="Enter your access password"
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#1e1a16", fontSize: "16px", fontFamily: SANS, padding: "0.25rem 0" }}
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
            style={{ width: "100%", marginTop: "1rem", background: licenseKey.trim() && !licenseLoading ? "#2d5a3d" : "rgba(45,90,61,0.18)", border: "none", borderRadius: "6px", padding: "14px", fontSize: "15px", color: licenseKey.trim() && !licenseLoading ? "#fff" : "rgba(30,26,22,0.38)", cursor: licenseKey.trim() && !licenseLoading ? "pointer" : "default", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
          >
            {licenseLoading ? "Verifying..." : "Unlock \u2192"}
          </button>

          <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "14px", color: "rgba(30,26,22,0.38)", fontFamily: SERIF }}>
            Do not have an access password?{" "}
            <a href="https://zborchster.gumroad.com/l/dxrekr" style={{ color: "#2d5a3d", textDecoration: "underline" }}>
              Purchase access here
            </a>
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "11px", color: "rgba(30,26,22,0.38)", letterSpacing: "0.04em", fontFamily: SANS }}>
            Spiritual and energetic interpretation — not a substitute for medical care.
          </div>
        </div>
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; }
          input::placeholder { color: rgba(30,26,22,0.25); }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>

      <div style={{ borderBottom: `1px solid ${c.border}`, padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: c.bgHeader, position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "2px", fontFamily: SANS, fontWeight: 600 }}>Body as Soul Tech</div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS }}>Symptom Interpreter</div>
        </div>
      </div>

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
                  Interpret &rarr;
                </button>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: "11px", color: c.textMuted, marginTop: "0.75rem", letterSpacing: "0.03em", fontFamily: SANS }}>
              Spiritual and energetic interpretation — not a substitute for medical care.
            </div>
          </div>
        </div>
      )}

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
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "10px", padding: "10px 14px" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={step === "context" ? "Share what is going on in your life..." : "Ask a follow-up or describe another symptom..."}
                rows={2}
                style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "18px", fontFamily: SERIF, lineHeight: 1.6, resize: "none", width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  style={{ background: input.trim() && !loading ? c.accent : c.accentMid, border: "none", borderRadius: "4px", padding: "7px 18px", cursor: input.trim() && !loading ? "pointer" : "default", color: input.trim() && !loading ? "#fff" : c.textMuted, fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
                >
                  Send &rarr;
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
