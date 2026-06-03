import { useState, useRef, useEffect } from "react";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

const SANS = "'Plus Jakarta Sans','system-ui',sans-serif";
const SERIF = "'Crimson Text','Georgia',serif";
const ACCESS_PASSWORD = "bodyspeak";
const FREE_RESPONSE_LIMIT = 2;

async function validateLicenseKey(key) {
  return key.trim().toLowerCase() === ACCESS_PASSWORD;
}

export default function BASTInterpreter() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('bast_messages');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem('bast_unlocked') === 'true'; }
    catch { return false; }
  });
  const [freeResponsesUsed, setFreeResponsesUsed] = useState(() => {
    try { return parseInt(localStorage.getItem('bast_free_used') || '0'); }
    catch { return 0; }
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);

  const messagesEndRef = useRef(null);

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

  const isFree = !unlocked;
  const hitLimit = isFree && freeResponsesUsed >= FREE_RESPONSE_LIMIT;

  useEffect(() => {
    if (loading) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading]);

  // Auto-submit if landing page passed a query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q && messages.length === 0) {
      // Clean the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-submit the message
      const userMessage = { role: "user", content: q };
      setMessages([userMessage]);
      setInput("");
      setLoading(true);
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [userMessage],
        }),
      })
        .then(r => r.json())
        .then(data => {
          const text = data.content?.find(b => b.type === "text")?.text || "Something went wrong. Please try again.";
          setMessages([userMessage, { role: "assistant", content: text }]);
          if (isFree) {
            const newCount = freeResponsesUsed + 1;
            setFreeResponsesUsed(newCount);
            if (newCount >= FREE_RESPONSE_LIMIT) setShowPaywall(true);
          }
        })
        .catch(() => {
          setMessages([userMessage, { role: "assistant", content: "There was a connection error. Please try again." }]);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('bast_messages', JSON.stringify(messages)); }
    catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem('bast_unlocked', unlocked ? 'true' : 'false'); }
    catch {}
  }, [unlocked]);

  useEffect(() => {
    try { localStorage.setItem('bast_free_used', String(freeResponsesUsed)); }
    catch {}
  }, [freeResponsesUsed]);

  const clearHistory = () => {
    setMessages([]);
    setShowPaywall(false);
    try { localStorage.removeItem('bast_messages'); }
    catch {}
  };

  const handleLicenseSubmit = async () => {
    if (!licenseKey.trim()) return;
    setLicenseLoading(true);
    setLicenseError("");
    const valid = await validateLicenseKey(licenseKey);
    if (valid) {
      setUnlocked(true);
      setShowPaywall(false);
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
    if (hitLimit) { setShowPaywall(true); return; }

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
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "Something went wrong. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
      if (isFree) {
        const newCount = freeResponsesUsed + 1;
        setFreeResponsesUsed(newCount);
        if (newCount >= FREE_RESPONSE_LIMIT) setShowPaywall(true);
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
    const patterns = [
      /Soul Guidance Question[:\s]*/i,
      /Soul Guidance[:\s]*/i,
      /Guidance Question[:\s]*/i,
    ];
    let splitIndex = -1;
    let matchLength = 0;
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        splitIndex = content.indexOf(match[0]);
        matchLength = match[0].length;
        break;
      }
    }
    if (splitIndex !== -1) {
      const before = content.substring(0, splitIndex).trim();
      let rawQuestion = content.substring(splitIndex + matchLength).trim();
      const questionEnd = rawQuestion.search(/\n\n|\n[A-Z]/);
      const question = questionEnd !== -1 ? rawQuestion.substring(0, questionEnd).trim() : rawQuestion.trim();
      const remainder = questionEnd !== -1 ? rawQuestion.substring(questionEnd).trim() : "";
      return (
        <>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{before}</div>
          {remainder ? <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82, marginTop: "1rem" }}>{remainder}</div> : null}
          <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "rgba(193,127,58,0.08)", borderLeft: "3px solid #c17f3a", borderRadius: "0 8px 8px 0" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c17f3a", marginBottom: "0.4rem", fontFamily: SANS }}>
              Soul Guidance Question
            </div>
            <div style={{ fontSize: "18px", fontStyle: "italic", lineHeight: 1.75, color: "#1e1a16", fontFamily: SERIF }}>
              {question}
            </div>
          </div>
        </>
      );
    }
    return <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{content}</div>;
  };


  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column" }}>

      {showPaywall && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30,26,22,0.85)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#faf8f4", borderRadius: "12px", padding: "2.5rem", maxWidth: "480px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "0.75rem", fontFamily: SANS }}>
              Body as Soul Tech
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: c.textPrimary, marginBottom: "1rem", fontFamily: SANS, lineHeight: 1.2 }}>
              You've experienced your free response
            </div>
            <div style={{ fontSize: "18px", color: c.textSecondary, lineHeight: 1.75, fontFamily: SERIF, marginBottom: "1.75rem" }}>
              Unlock unlimited conversations — your body, your life, your relationships, and your deepest questions, interpreted through a soul lens.
            </div>
            <a href="https://zborchster.gumroad.com/l/dxrekr" target="_blank" style={{ display: "block", background: c.accent, color: "#fff", padding: "14px", borderRadius: "6px", fontSize: "15px", fontWeight: 700, fontFamily: SANS, letterSpacing: "0.04em", textDecoration: "none", marginBottom: "1.25rem" }}>
              Get Unlimited Access — $22
            </a>
            <div style={{ fontSize: "13px", color: c.textMuted, fontFamily: SERIF, marginBottom: "1.5rem" }}>
              Already purchased?
            </div>
            <div style={{ background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "0.75rem" }}>
              <input
                type="password"
                value={licenseKey}
                onChange={e => { setLicenseKey(e.target.value); setLicenseError(""); }}
                onKeyDown={handleLicenseKeyDown}
                placeholder="Enter your access password"
                autoFocus
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "15px", fontFamily: SANS }}
              />
            </div>
            {licenseError && (
              <div style={{ fontSize: "13px", color: "#b94040", fontFamily: SERIF, marginBottom: "0.75rem" }}>
                {licenseError}
              </div>
            )}
            <button
              onClick={handleLicenseSubmit}
              disabled={!licenseKey.trim() || licenseLoading}
              style={{ width: "100%", background: licenseKey.trim() && !licenseLoading ? c.accent : c.accentMid, border: "none", borderRadius: "6px", padding: "12px", fontSize: "14px", color: licenseKey.trim() && !licenseLoading ? "#fff" : c.textMuted, cursor: licenseKey.trim() && !licenseLoading ? "pointer" : "default", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em" }}>
              {licenseLoading ? "Verifying..." : "Unlock →"}
            </button>
            <div style={{ marginTop: "1rem", fontSize: "11px", color: c.textMuted, fontFamily: SANS, letterSpacing: "0.03em" }}>
              🔒 All conversations are private and confidential
            </div>
          </div>
        </div>
      )}

      <div style={{ borderBottom: `1px solid ${c.border}`, padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: c.bgHeader, position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "2px", fontFamily: SANS, fontWeight: 600 }}>Body as Soul Tech</div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS }}>Know Yourself</div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {isFree && !showPaywall && (
            <div style={{ fontSize: "11px", color: c.textMuted, fontFamily: SANS }}>
              {freeResponsesUsed === 0 ? "1 free response remaining" : "Free response used"}
            </div>
          )}
          {messages.length > 0 && (
            <button onClick={clearHistory} style={{ background: "transparent", border: `1px solid ${c.borderMid}`, color: c.textMuted, padding: "6px 14px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontFamily: SANS, fontWeight: 500 }}>
              Clear history
            </button>
          )}
        </div>
      </div>

      {messages.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
          <div style={{ width: "100%", maxWidth: "620px" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "1rem", fontFamily: SANS }}>
                Know Yourself
              </div>
              <div style={{ fontSize: "27px", fontWeight: 700, color: c.textPrimary, marginBottom: "1.25rem", lineHeight: 1.2, fontFamily: SANS, letterSpacing: "-0.01em" }}>
                What is going on in your life?
              </div>
              <div style={{ fontSize: "18px", color: c.textSecondary, lineHeight: 1.85, fontFamily: SERIF }}>
                Describe what is happening in your body, your life, your relationships, or your inner world. You can ask me anything you want to understand about the soul, the body, and how you are designed.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "12px", padding: "12px 16px" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what is going on in your life..."
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
                placeholder="Ask a follow-up, describe another symptom, or ask anything..."
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
