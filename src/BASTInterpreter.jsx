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

// Scrolling to the top sounds trivial but isn't always reliable in
// practice: window.scrollTo alone can silently no-op on some mobile
// browsers, different browsers read scroll position off window vs
// document.documentElement vs document.body inconsistently, and a late
// layout shift (web fonts finishing their swap-in, for instance) can
// nudge the page after the initial scroll already fired. This covers
// all of those bases and re-asserts once, shortly after mount.
function scrollToTop(startElRef, innerRef) {
  try {
    // window.scrollTo only resets the actual browser window's own
    // scroll position — but this app's outer HTML shell isn't defined
    // in this file, and if some wrapper element up the tree has its own
    // overflow-y: auto (a #root div, for instance) rather than relying
    // on the window itself scrolling, that's the element that's actually
    // moving when someone scrolls, and window.scrollTo silently does
    // nothing useful to it. Rather than guess which one it is, walk up
    // from a known element in this component and reset scrollTop on
    // every ancestor that's actually capable of scrolling, whichever
    // one that turns out to be.
    let el = startElRef && startElRef.current;
    while (el) {
      if (el.scrollTop > 0) el.scrollTop = 0;
      el = el.parentElement;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Some screens have their own internally-scrolling region (the
    // grouped body-part options, when there's enough content to need
    // it) — that's a separate scroll context from the page itself, so
    // resetting the window's scroll position never touches it. Reset it
    // explicitly too whenever a ref to one is passed in.
    if (innerRef && innerRef.current) {
      innerRef.current.scrollTop = 0;
    }
  } catch {}
}

// scrollToTop assumes window scroll position 0 is the correct target —
// true in most cases, but if it isn't landing right for some reason
// this doesn't depend on, this measures reality directly instead of
// assuming: where the "Free Reading" label actually is on screen right
// now, and how tall the sticky header actually renders at, then moves
// the window by exactly the difference. That self-corrects regardless
// of what's causing any discrepancy, rather than repeating the same
// assumption and hoping it holds.
function scrollLabelBelowHeader(labelRef) {
  try {
    if (!labelRef || !labelRef.current) return;
    const headerEl = document.getElementById("app-header");
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const rect = labelRef.current.getBoundingClientRect();
    const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const target = Math.max(0, currentScroll + rect.top - headerHeight - 12);
    window.scrollTo({ top: target, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = target;
    document.body.scrollTop = target;
  } catch {}
}

// The chat screen doesn't have a per-question label to anchor against
// the way the wizard does — but it has the header itself, and "is the
// header actually fully visible" is exactly the thing that needs to be
// true. Measure the header's own position directly: if its top isn't
// at 0, the window is off by exactly that amount, so correct by that
// precise difference instead of assuming a blind scroll-to-0 landed
// correctly.
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

function useScrollToTopOnMount(startElRef, innerRef, labelRef) {
  useEffect(() => {
    const runReset = () => {
      scrollToTop(startElRef, innerRef);
      scrollLabelBelowHeader(labelRef);
    };
    runReset();
    // The first scroll call can silently no-op on some mobile browsers
    // (a known quirk, not specific to this app), so retries exist to
    // correct that. They need to be dense and early to actually feel
    // reliable — a sparse, late-starting schedule leaves the screen
    // visibly unscrolled for a stretch that reads as "broken" even
    // though it self-corrects eventually. (An earlier version spaced
    // these out to avoid interfering with a fast tap on the next
    // question, but that interference was actually caused by a
    // document.activeElement.blur() call that's since been removed —
    // it's safe to be dense and early again without reintroducing
    // that.)
    const raf1 = requestAnimationFrame(runReset);
    const timers = [30, 60, 100, 200, 350, 500].map(delay => setTimeout(runReset, delay));

    // Dismissing the on-screen keyboard resizes the viewport, and
    // different mobile browsers finish that resize on different
    // timelines — timed retries alone are a guess about how long that
    // takes, and a guess that's right for one browser can be wrong for
    // another. Re-asserting on the actual resize event, whenever it
    // fires, isn't a guess: it directly catches the moment the viewport
    // actually finishes changing, regardless of how long that took on
    // this particular browser.
    const handleResize = () => runReset();
    window.addEventListener("resize", handleResize);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener("resize", handleResize);

    // Stop listening after a few seconds so this isn't still fighting
    // the user's own deliberate scrolling later in the same screen.
    const stopListening = setTimeout(() => {
      window.removeEventListener("resize", handleResize);
      if (vv) vv.removeEventListener("resize", handleResize);
    }, 2500);

    return () => {
      cancelAnimationFrame(raf1);
      timers.forEach(clearTimeout);
      clearTimeout(stopListening);
      window.removeEventListener("resize", handleResize);
      if (vv) vv.removeEventListener("resize", handleResize);
    };
  }, []);
}

function formatMessage(content) {
  return <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.82 }}>{content}</div>;
}

// ---- SHARED HEADER (hoisted to module scope so it isn't recreated, and
// therefore remounted, on every keystroke of a parent-controlled input) ----

function Header({ onClear }) {
  return (
    <div id="app-header" style={{ position: "fixed", top: 0, left: 0, right: 0, borderBottom: `1px solid ${c.border}`, padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: c.bgHeader, zIndex: 50 }}>
      <div>
        <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: c.accent, marginBottom: "2px", fontFamily: SANS, fontWeight: 600 }}>Voltage Wellness</div>
        <div style={{ fontSize: "17px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS }}>Energetic Root Cause</div>
      </div>
      {onClear && (
        <button
          onClick={() => {
            if (window.confirm("Start over? This clears everything you've entered so far.")) {
              onClear();
            }
          }}
          style={{ background: "transparent", border: `1px solid ${c.borderMid}`, borderRadius: "6px", padding: "7px 14px", cursor: "pointer", color: c.textMuted, fontSize: "12px", fontFamily: SANS, fontWeight: 600, letterSpacing: "0.02em" }}
        >
          Clear chat
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

function QuestionScreen({ questions, index, tierLabel, loading, textDraft, setTextDraft, handleTextKeyDown, multiSelected, toggleMultiSelect1, submitT1Multi, goBackT1 }) {
  const rootElRef = useRef(null);
  const labelRef = useRef(null);
  useScrollToTopOnMount(rootElRef, null, labelRef);

  const q = questions[index];
  const needsSomewhereElseDetail = q.id === "region" && multiSelected.includes("Somewhere else");
  const detailLabel = needsSomewhereElseDetail
    ? "You selected somewhere else — where is this happening, specifically?"
    : (q.detailLabel || "Anything else to add? (optional)");
  const blocked = (q.required && multiSelected.length === 0 && !textDraft.trim())
    || (needsSomewhereElseDetail && !textDraft.trim());

  return (
    <div ref={rootElRef} style={{ width: "100%", maxWidth: "620px", margin: "1.75rem auto", padding: "0 1.5rem", boxSizing: "border-box" }}>
      <div style={{ width: "100%" }}>
        <div style={{ background: c.bgInput, border: `1.5px solid ${c.borderMid}`, borderRadius: "12px", padding: "24px 26px", textAlign: "left" }}>
          <div ref={labelRef} style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: c.accent, marginBottom: "0.9rem", fontFamily: SANS }}>
            {tierLabel} · Question {index + 1} of {questions.length}
          </div>
          <div style={{ fontSize: "21px", fontWeight: 700, color: c.textPrimary, marginBottom: "0.4rem", lineHeight: 1.35, fontFamily: SANS }}>
            {q.q}
          </div>
          {q.hint && (
            <div style={{ fontSize: "14px", color: c.textMuted, lineHeight: 1.6, marginBottom: "0.5rem", fontFamily: SERIF, fontStyle: "italic" }}>
              {q.hint}
            </div>
          )}
          {q.options.length > 0 && (
            <div style={{ fontSize: "12px", color: c.textMuted, marginBottom: "1rem", fontFamily: SANS, fontStyle: "italic" }}>
              {q.singleSelect ? "Select one" : "Select all that apply"}
            </div>
          )}
          {q.required && (
            <div style={{ fontSize: "12px", color: c.accentPop, marginBottom: "1rem", fontFamily: SANS, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Required
            </div>
          )}
          {q.optional && (
            <div style={{ fontSize: "12px", color: c.accentPop, marginBottom: "1rem", fontFamily: SANS, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Optional — skip if unsure
            </div>
          )}

          {q.options.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "1.1rem" }}>
              {q.options.map(opt => {
                const selected = multiSelected.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleMultiSelect1(opt)}
                    disabled={loading}
                    style={{
                      background: selected ? c.accent : c.bg,
                      border: `1.5px solid ${selected ? c.accent : c.borderMid}`,
                      borderRadius: "10px",
                      padding: "12px 20px",
                      fontSize: "16px",
                      color: selected ? "#fff" : c.textPrimary,
                      cursor: loading ? "default" : "pointer",
                      fontFamily: SERIF,
                      fontWeight: selected ? 600 : 400,
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    {selected ? "✓ " : ""}{opt}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ fontSize: "14px", color: needsSomewhereElseDetail ? c.accent : c.textSecondary, fontFamily: SANS, fontWeight: 600, marginBottom: "0.5rem" }}>
            {detailLabel}
          </div>
          <div style={{ background: c.bg, border: `1px solid ${needsSomewhereElseDetail ? c.accent : c.borderMid}`, borderRadius: "8px", padding: "12px 14px" }}>
            <textarea
              value={textDraft}
              onChange={e => setTextDraft(e.target.value)}
              onKeyDown={handleTextKeyDown(submitT1Multi)}
              placeholder="Type here..."
              rows={3}
              autoFocus={q.options.length === 0}
              style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "17px", fontFamily: SERIF, lineHeight: 1.7, resize: "none", width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginTop: "0.6rem" }}>
            {index > 0 ? (
              <button
                onClick={goBackT1}
                disabled={loading}
                style={{ background: "transparent", border: "none", color: c.textMuted, padding: "8px 4px", cursor: loading ? "default" : "pointer", fontSize: "13px", fontFamily: SANS, fontWeight: 600, letterSpacing: "0.03em" }}
              >
                &larr; Back
              </button>
            ) : <div />}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {blocked && (
                <div style={{ fontSize: "12px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic" }}>
                  Please fill this in to continue
                </div>
              )}
              <button
                onClick={submitT1Multi}
                disabled={loading || blocked}
                style={{ background: loading || blocked ? c.accentMid : c.accent, border: "none", borderRadius: "6px", padding: "10px 22px", cursor: loading ? "default" : "pointer", color: loading || blocked ? c.textMuted : "#fff", fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
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

function BodyPartFormScreen({ q, index, total, loading, bodyPartSelections, toggleBodyPartOption, setBodyPartDetail, handleTextKeyDown, submitBodyPartForm, goBackT1 }) {
  const rootElRef = useRef(null);
  const innerScrollRef = useRef(null);
  const labelRef = useRef(null);
  useScrollToTopOnMount(rootElRef, innerScrollRef, labelRef);

  const sideGroup = q.groups.find(g => g.key === "side");
  const otherGroups = q.groups.filter(g => g.key !== "side");
  const bothSides = q.hasSide && (bodyPartSelections.side || []).includes("Left") && (bodyPartSelections.side || []).includes("Right");
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
                background: selected ? c.accent : c.bg,
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
    <div key={detailKey} style={{ marginBottom: "1.4rem" }}>
      <div style={{ fontSize: "13px", color: c.textSecondary, fontFamily: SANS, fontWeight: 600, marginBottom: "0.5rem" }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: c.bg, border: `1px solid ${c.borderMid}`, borderRadius: "12px", padding: "12px 16px" }}>
        <textarea
          value={bodyPartSelections[detailKey] || ""}
          onChange={e => setBodyPartDetail(detailKey, e.target.value)}
          onKeyDown={handleTextKeyDown(submitBodyPartForm)}
          placeholder="Type here..."
          rows={2}
          style={{ background: "transparent", border: "none", outline: "none", color: c.textPrimary, fontSize: "16px", fontFamily: SERIF, lineHeight: 1.6, resize: "none", width: "100%" }}
        />
      </div>
    </div>
  );

  return (
    <div ref={rootElRef} style={{ width: "100%", maxWidth: "620px", margin: "1.75rem auto", padding: "0 1.5rem", boxSizing: "border-box" }}>
      <div style={{ width: "100%" }}>
        <div style={{ background: c.bgInput, border: `1.5px solid ${c.borderMid}`, borderRadius: "12px", padding: "24px 26px", textAlign: "left" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <div ref={labelRef} style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: c.accent, marginBottom: "0.9rem", fontFamily: SANS }}>
              Free Reading · Question {index + 1} of {total}
            </div>
            <div style={{ fontSize: "21px", fontWeight: 700, color: c.textPrimary, marginBottom: "0.4rem", lineHeight: 1.35, fontFamily: SANS, textTransform: "capitalize" }}>
              Tell us about your {q.bodyPart}
            </div>
            <div style={{ fontSize: "13px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic" }}>
              Select whatever applies below — skip anything that doesn't make sense for this body part.
            </div>
          </div>

          <div ref={innerScrollRef} style={{ maxHeight: "54vh", overflowY: "auto", paddingRight: "4px" }}>
            {sideGroup && renderOptionGroup(sideGroup, "side", null)}

            {bothSides ? (
              <>
                <div style={{ margin: "1.5rem 0 1.1rem" }}>
                  <div style={{ display: "inline-block", background: c.accent, color: "#fff", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "5px 14px", borderRadius: "20px", marginBottom: "0.6rem", fontFamily: SANS }}>
                    Left side
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS, letterSpacing: "-0.01em", textTransform: "capitalize" }}>
                    Now, tell us about your left {q.bodyPart}
                  </div>
                </div>
                {otherGroups.map(g => renderOptionGroup(g, `left_${g.key}`, null))}
                {renderDetailBox("left_detail", `Do you know when this first started in your left ${q.bodyPart}, or what the situation was when it appeared? (optional)`)}

                <div style={{ margin: "2rem 0 1.1rem", borderTop: `2px solid ${c.borderMid}`, paddingTop: "1.75rem" }}>
                  <div style={{ display: "inline-block", background: c.accent, color: "#fff", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "5px 14px", borderRadius: "20px", marginBottom: "0.6rem", fontFamily: SANS }}>
                    Right side
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: c.textPrimary, fontFamily: SANS, letterSpacing: "-0.01em", textTransform: "capitalize" }}>
                    Now, tell us about your right {q.bodyPart}
                  </div>
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
            {index > 0 ? (
              <button
                onClick={goBackT1}
                disabled={loading}
                style={{ background: "transparent", border: "none", color: c.textMuted, padding: "8px 4px", cursor: loading ? "default" : "pointer", fontSize: "13px", fontFamily: SANS, fontWeight: 600, letterSpacing: "0.03em" }}
              >
                &larr; Back
              </button>
            ) : <div />}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {detailMissing && (
                <div style={{ fontSize: "12px", color: c.textMuted, fontFamily: SANS, fontStyle: "italic" }}>
                  Please fill this in to continue
                </div>
              )}
              <button
                onClick={submitBodyPartForm}
                disabled={loading || detailMissing}
                style={{ background: loading || detailMissing ? c.accentMid : c.accent, border: "none", borderRadius: "6px", padding: "10px 22px", cursor: (loading || detailMissing) ? "default" : "pointer", color: (loading || detailMissing) ? c.textMuted : "#fff", fontSize: "13px", fontFamily: SANS, fontWeight: 700, letterSpacing: "0.04em", transition: "all 0.15s" }}
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
            <div
              key={i}
              ref={i === lastRealIndex ? lastMessageRef : null}
              style={{ marginBottom: "2rem" }}
            >
              {msg.isDonationNote ? (
                <div style={{ background: c.bgInput, border: `1px solid ${c.borderMid}`, borderRadius: "12px", padding: "1.25rem 1.4rem", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: c.textMuted, marginBottom: "0.7rem", fontFamily: SANS }}>
                    A note from Zach, the creator
                  </div>
                  <div style={{ fontSize: "16px", color: c.textPrimary, lineHeight: 1.8, fontFamily: SERIF }}>
                    Every reading this tool generates costs money to produce. There's no paywall, and there never will be. But if this meant something to you and you'd like to help cover what it costs to run, any amount is appreciated.
                    <div style={{ marginTop: "0.6rem" }}>No pressure either way.</div>
                  </div>
                  <a href="https://buy.stripe.com/dRmeVeaVFg2f2Oj4GO9ws00" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "1rem", background: c.accent, border: "none", borderRadius: "6px", padding: "10px 22px", fontFamily: SANS, fontSize: "13px", fontWeight: 700, letterSpacing: "0.03em", color: "#fff", textDecoration: "none" }}>
                    Support This Tool
                  </a>
                </div>
              ) : msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: c.userBubble, border: `1px solid ${c.userBubbleBorder}`, borderRadius: "14px 14px 2px 14px", padding: "12px 18px", maxWidth: "85%", fontSize: "15px", lineHeight: 1.65, color: c.textSecondary, whiteSpace: "pre-wrap", fontFamily: SERIF }}>
                    {msg.display || msg.content}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: c.accentLight, border: `1px solid ${c.borderMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: c.accent, flexShrink: 0, marginTop: "2px", fontFamily: SANS }}>&#10022;</div>
                    <div style={{ flex: 1, fontSize: "18px", color: c.textPrimary, fontFamily: SERIF }}>{formatMessage(msg.content)}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "0.9rem", marginLeft: "40px" }}>
                    <button
                      onClick={() => copyReadingText(msg.content, i)}
                      style={{ background: "transparent", border: `1px solid ${c.borderMid}`, borderRadius: "6px", padding: "6px 14px", fontFamily: SANS, fontSize: "12px", fontWeight: 600, color: c.textSecondary, cursor: "pointer", letterSpacing: "0.02em" }}
                    >
                      {copiedIndex === i ? "Copied ✓" : "Copy"}
                    </button>
                    <button
                      onClick={() => downloadReadingText(msg.content, msg.readingLabel || "response")}
                      style={{ background: "transparent", border: `1px solid ${c.borderMid}`, borderRadius: "6px", padding: "6px 14px", fontFamily: SANS, fontSize: "12px", fontWeight: 600, color: c.textSecondary, cursor: "pointer", letterSpacing: "0.02em" }}
                    >
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
    singleSelect: true,
    q: "Do you have a medical diagnosis (or diagnoses)?",
    detailLabel: "If yes, what's the diagnosis?",
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
      "Head", "Neck", "Throat", "Mouth", "Shoulders", "Chest", "Heart",
      "Upper Back", "Lower Back", "Abdomen", "Gut", "Hips", "Pelvis",
      "Legs", "Knees", "Ankles", "Feet", "Arms", "Hands", "Skin", "Somewhere else",
    ],
  },
  {
    id: "side",
    type: "multiselect",
    q: "Is it more on the left side, the right side, or centered?",
    detailLabel: "Anything else to add? (optional)",
    options: ["Left side", "Right side", "Centered"],
  },
  {
    id: "plane",
    type: "multiselect",
    q: "Do you feel it more toward the front, or more toward the back?",
    detailLabel: "Anything else to add? (optional)",
    options: ["Front", "Back"],
  },
  {
    id: "quality",
    type: "multiselect",
    q: "How would you describe it? You can explain further in the box below.",
    detailLabel: "Anything else to add about how it feels? (optional)",
    options: ["Sharp", "Dull ache", "Sore", "Burning", "Tight", "Stiff", "Throbbing", "Numb", "Cramping", "Tingling", "Swollen", "Bloating", "Pressure", "Heavy", "Weak"],
  },
  {
    id: "pattern",
    type: "multiselect",
    q: "Is this the first time you've had this, does it come and go, or is it constant / ongoing?",
    detailLabel: "Anything else to add about the pattern? (optional)",
    options: ["First time", "Comes and goes", "Constant / ongoing"],
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
  "Head": "head", "Neck": "neck", "Throat": "throat", "Mouth": "mouth", "Shoulders": "shoulder",
  "Chest": "chest", "Heart": "heart", "Upper Back": "upper back", "Lower Back": "lower back",
  "Abdomen": "abdomen", "Gut": "gut", "Hips": "hip", "Pelvis": "pelvis",
  "Legs": "leg", "Knees": "knee", "Ankles": "ankle", "Feet": "foot",
  "Arms": "arm", "Hands": "hand", "Skin": "skin", "Somewhere else": "the area you mentioned",
};

// Not every body part has a meaningful left/right or front/back — a gut
// or a throat doesn't split that way the way a knee or a shoulder does.
// Quality and pattern always apply; side and plane only show up where
// they'd actually mean something.
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

function regionDisplayName(region) {
  return REGION_DISPLAY[region] || region.toLowerCase();
}

// The general sensation list (Sharp, Burning, Tight, etc.) covers most of
// the body well, but doesn't fit skin — nobody describes a rash as
// "throbbing" or a breakout as "cramping." Skin gets its own tailored
// set instead of cluttering the shared list with terms that would only
// ever apply to one body part.
const QUALITY_OPTIONS_DEFAULT = ["Sharp", "Dull ache", "Sore", "Burning", "Tight", "Stiff", "Throbbing", "Numb", "Cramping", "Tingling", "Swollen", "Bloating", "Pressure", "Heavy", "Weak"];
const QUALITY_OPTIONS_BY_REGION = {
  "Skin": ["Itchy", "Dry", "Flaky", "Rash", "Burning", "Tingling", "Tight", "Breakouts", "Redness", "Numb"],
};

function buildBodyPartForm(region, overrideDisplay) {
  const display = overrideDisplay || regionDisplayName(region);
  const slug = regionDisplayName(region).replace(/\s+/g, "_");
  const config = REGION_GROUP_CONFIG[region] || { side: true, plane: true };
  const qualityOptions = QUALITY_OPTIONS_BY_REGION[region] || QUALITY_OPTIONS_DEFAULT;

  const groups = [];
  if (config.side) {
    const sideOptions = ["Left", "Right"];
    if (config.centered) sideOptions.push("Centered");
    groups.push({ key: "side", label: "Which side?", options: sideOptions });
  }
  if (config.plane) groups.push({ key: "plane", label: "Front or back?", options: ["Front", "Back"] });
  groups.push({ key: "quality", label: "What does it feel like? You can explain further in the box below.", options: qualityOptions });
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

// A description longer than this reads awkwardly once title-cased into a
// heading ("Tell us about your ..."), so it gets trimmed to the first
// clause or a reasonable length rather than shown in full there. The full
// text is still what's sent to the model — only the heading is shortened.
function shortenForHeading(text, maxLen) {
  const firstClause = text.split(/[.!?]\s|,\s(?=and|but|which)/)[0].trim();
  const base = firstClause.length >= 8 ? firstClause : text;
  if (base.length <= maxLen) return base;
  return base.slice(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

function patchQuestionsForBodyParts(questions, regionAnswer) {
  const selected = (regionAnswer && regionAnswer.selected) || [];
  const somewhereElseDetail = (regionAnswer && regionAnswer.detail && regionAnswer.detail.trim()) || "";

  const bodyPartForms = selected.map(region => {
    if (region === "Somewhere else" && somewhereElseDetail) {
      return buildBodyPartForm(region, shortenForHeading(somewhereElseDetail, 60));
    }
    return buildBodyPartForm(region);
  });

  // This can run more than once for the same person — if they go back
  // to the region question and change their selection, whatever got
  // patched in last time (earlier body-part forms, or the original
  // side/plane/quality/pattern placeholders on the very first pass)
  // needs to be replaced with a fresh set reflecting the CURRENT
  // selection, not left sitting alongside it. Strip every existing
  // body-part-form entry and the original placeholder questions, and
  // insert the freshly-built set in that same spot — including the
  // empty-selection case, where the right result is removing the old
  // forms and inserting nothing.
  let inserted = false;
  const result = [];
  for (const q of questions) {
    if (q.type === "bodyPartForm" || q.id === "side") {
      if (!inserted) {
        result.push(...bodyPartForms);
        inserted = true;
      }
      continue;
    }
    if (q.id === "plane" || q.id === "quality" || q.id === "pattern") continue;
    result.push(q);
  }
  if (!inserted) {
    result.push(...bodyPartForms);
  }
  return result;
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

  const bothSides = ans.side && ans.side.includes("Left") && ans.side.includes("Right");
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

export default function BASTInterpreter() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("bast_messages");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  // step: 'tier1' (intake wizard) -> 'chat' (Initial Reading, then an
  // open-ended, ongoing conversation — no separate stages after that)
  const [step, setStep] = useState(() => {
    try { return localStorage.getItem("bast_step") || "tier1"; }
    catch { return "tier1"; }
  });
  const [t1Index, setT1Index] = useState(0);
  const [answersT1, setAnswersT1] = useState({});
  const [multiSelected, setMultiSelected] = useState([]);
  const [bodyPartSelections, setBodyPartSelections] = useState({});
  const [effectiveTier1Questions, setEffectiveTier1Questions] = useState(QUESTIONS_TIER1);
  const [chatDraft, setChatDraft] = useState("");
  const [textDraft, setTextDraft] = useState("");

  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    // Position content within the transcript's own scroll container
    // directly, by setting its scrollTop, rather than using
    // element.scrollIntoView() — scrollIntoView scrolls whatever the
    // browser decides is the "necessary" scrolling ancestor, and on some
    // mobile browsers that can end up including the window itself even
    // when a nearer container should have absorbed it, fighting against
    // the separate effect responsible for keeping the window pinned to
    // the top on each step transition. Setting scrollTop on the known
    // container directly has no such ambiguity — it can only ever move
    // that one element, never the window.
    const scrollWithinContainer = (targetEl, align) => {
      const container = scrollContainerRef.current;
      if (!container || !targetEl) return;
      if (align === "end") {
        container.scrollTop = container.scrollHeight;
      } else {
        // offsetTop depends on the browser's offsetParent calculation,
        // which can be thrown off by intermediate padded or positioned
        // ancestors — producing a small, consistent gap rather than a
        // total failure, which is exactly the kind of thing that's easy
        // to miss until something else (like the header layout) changes
        // and makes it visible. Measuring the actual current gap between
        // the two elements directly is precise regardless of DOM
        // structure in between.
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        // A small buffer so this lands slightly above the exact
        // calculated boundary rather than butting right up against it.
        const buffer = 12;
        container.scrollTop = Math.max(0, container.scrollTop + (targetRect.top - containerRect.top) - buffer);
      }
    };
    const timers = [];
    if (loading) {
      // Still generating — keep the loading indicator in view.
      scrollWithinContainer(messagesEndRef.current, "end");
    } else if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      // A reading just landed — show its beginning, not its end.
      // Re-asserting several times shortly after covers any late content
      // reflow (web fonts swapping in, a long response's height still
      // settling), including the bigger layout settling that happens
      // specifically on the tier1 -> chat transition, when the Initial
      // Reading first lands on a freshly-mounted screen.
      scrollWithinContainer(lastMessageRef.current, "start");
      [30, 60, 120, 250, 400, 650, 900].forEach(delay => {
        timers.push(setTimeout(() => scrollWithinContainer(lastMessageRef.current, "start"), delay));
      });
    }
    return () => { timers.forEach(clearTimeout); };
  }, [loading, messages]);

  // The scroll-reset above only moves content around inside the
  // transcript's own scrolling region — it never touches the window's
  // own scroll position. That's a real gap: this app's screens after
  // the wizard use a fixed-height, non-scrolling outer shell (so the
  // header stays visible in principle), but nothing ever explicitly
  // resets the window if it was scrolled down during the question
  // wizard just before this. Reset it explicitly on every step
  // transition, so the header — and the Clear Chat button in it — is
  // reliably visible the moment a new screen (including the Initial
  // Reading landing) appears, the same way the wizard's own screens do.
  //
  // The transcript-internal scroll effect above now sets scrollTop
  // directly on its own container instead of using scrollIntoView, so
  // it can no longer bubble up and fight this one. Uses the same
  // measured approach as the wizard now uses (rather than assuming
  // scroll-to-0 is correct) and the same dense, early retry schedule —
  // that combination is what actually fixed the equivalent issue on the
  // question-to-question transitions, so this should get the same
  // reliability on the Initial Reading landing and other step changes.
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
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [step, messages.length]);

  const [copiedIndex, setCopiedIndex] = useState(null);

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
    const filename = (label || "reading").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".txt";
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    try { localStorage.setItem("bast_messages", JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem("bast_step", step); } catch {}
  }, [step]);


  async function callAPI(newMessages, maxTokens) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: maxTokens || 6000,
        system: SYSTEM_PROMPT,
        // Strip the local-only "display" field — the API only accepts
        // role/content on message objects. Also drop anything marked
        // localOnly (e.g. the donation note) — it should be visible in
        // the chat but never actually sent to the model.
        messages: newMessages.filter(m => !m.localOnly).map(({ role, content }) => ({ role, content })),
      }),
    });
    const data = await response.json();
    return data.content?.find(b => b.type === "text")?.text
      || "Something went wrong. Please try again.";
  }

  // ---- TIER 1 MULTI-SELECT ANSWER HANDLING ----

  const toggleMultiSelect1 = (option) => {
    const q = effectiveTier1Questions[t1Index];
    if (q?.singleSelect) {
      setMultiSelected([option]);
      return;
    }
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
      const bothSides = q.hasSide && (bodyPartSelections.side || []).includes("Left") && (bodyPartSelections.side || []).includes("Right");
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
      const text = await callAPI(newMessages, 6000);
      const withInitialReading = [...newMessages,
        { role: "assistant", content: text, isReading: true, readingLabel: "Initial Reading" },
      ];
      setMessages(withInitialReading);
      // Straight into the ongoing conversation — no separate "post-initial"
      // waiting screen, no button to press to formally begin. The chat
      // input is just there, always, right under the reading. (The
      // support note is no longer added here — see the effect below,
      // which delays it until the conversation has some real depth to
      // it rather than showing it immediately after the very first
      // reading.)
      setStep("chat");
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

  const goBackT1 = () => {
    if (t1Index === 0) return;
    const prevIndex = t1Index - 1;
    const prevQuestion = effectiveTier1Questions[prevIndex];
    const prevAnswer = answersT1[prevQuestion.id];
    if (prevQuestion.type === "bodyPartForm") {
      setBodyPartSelections(prevAnswer || {});
    } else {
      setMultiSelected((prevAnswer && prevAnswer.selected) || []);
      setTextDraft((prevAnswer && prevAnswer.detail) || "");
    }
    setT1Index(prevIndex);
  };

  const handleClearChat = () => {
    try {
      localStorage.removeItem("bast_messages");
      localStorage.removeItem("bast_step");
    } catch {}
    setMessages([]);
    setStep("tier1");
    setT1Index(0);
    setAnswersT1({});
    setMultiSelected([]);
    setBodyPartSelections({});
    setEffectiveTier1Questions(QUESTIONS_TIER1);
    setChatDraft("");
    setTextDraft("");
    scrollToTop();
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

  // ---- ONGOING CONVERSATION ----
  // Once the Initial Reading lands, this is just a normal back-and-forth:
  // send whatever the person typed plus the full conversation so far, get
  // a response back, show it. No status markers, no progress tracking,
  // no mechanical "signal when ready for the final reading" — the system
  // prompt's own judgment handles how deep to go and when a fuller
  // synthesis is actually earned, the same way any real conversation
  // would, for as long as the person wants to keep it going.

  // The support note used to appear immediately after the Initial
  // Reading — right when someone has the least context for why it's
  // there. Delaying it until there's been some real back-and-forth
  // gives it a better chance of landing as a genuine ask rather than
  // a reflex "here's the pitch" moment. "Real" messages here means
  // visible, substantive ones — not the hidden intake message, and
  // not this note itself once it's added (checked via isDonationNote
  // so it only ever gets inserted once, not re-added on every render).
  useEffect(() => {
    const realCount = messages.filter(m => !m.hidden && !m.localOnly).length;
    const alreadyHasNote = messages.some(m => m.isDonationNote);
    if (realCount >= 4 && !alreadyHasNote && !loading) {
      setMessages(prev => [...prev, { role: "assistant", content: "", localOnly: true, isDonationNote: true }]);
    }
  }, [messages, loading]);

  const sendChatMessage = async (userMsg) => {
    const newMessages = [...messages, userMsg];
    setLoading(true);
    setMessages(newMessages);
    try {
      const text = await callAPI(newMessages, 8000);
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "There was a connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const submitChatMessage = () => {
    const trimmed = chatDraft.trim();
    if (!trimmed || loading) return;
    setChatDraft("");
    sendChatMessage({ role: "user", content: trimmed, display: trimmed });
  };

  const handleTextKeyDown = (submitFn) => (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitFn(); }
  };

  // ---- RENDER: TIER 1 WIZARD ----

  if (step === "tier1" && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column", paddingTop: "80px" }}>
        <Header onClear={handleClearChat} />
        {t1Index === 0 && (
          <div style={{ textAlign: "center", maxWidth: "620px", margin: "1.5rem auto 0", padding: "0 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
              <svg width="88" height="88" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Voltage Wellness">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e1a16" strokeWidth="1" opacity="0.22"/>
                <line x1="50" y1="8" x2="50" y2="2" stroke="#1e1a16" strokeWidth="1.5" opacity="0.32"/>
                <line x1="50" y1="92" x2="50" y2="98" stroke="#1e1a16" strokeWidth="1.5" opacity="0.32"/>
                <line x1="8" y1="50" x2="2" y2="50" stroke="#1e1a16" strokeWidth="1.5" opacity="0.32"/>
                <line x1="92" y1="50" x2="98" y2="50" stroke="#1e1a16" strokeWidth="1.5" opacity="0.32"/>
                <path d="M42.4,34.83 L33.2,51.73 L47.5,51.93 L33.65,82.17 L72.0,44.73 L54.0,44.62 L53.3,17.83 Z" fill="#1e1a16"/>
              </svg>
            </div>
            <div style={{ fontSize: "38px", fontWeight: 800, color: c.textPrimary, lineHeight: 1.15, fontFamily: SANS, letterSpacing: "-0.02em" }}>
              Discover the <em style={{ color: c.accentPop, fontFamily: SERIF }}>root</em> cause.
            </div>
            <div style={{ fontSize: "17px", color: c.textSecondary, lineHeight: 1.8, fontFamily: SERIF, marginTop: "1rem" }}>
              Every symptom and disease traces back to an energetic block. Answer a few questions to discover what's actually causing yours.
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
            goBackT1={goBackT1}
          />
        ) : (
          <QuestionScreen key={t1Index} questions={effectiveTier1Questions} index={t1Index} tierLabel="Free Reading" loading={loading} textDraft={textDraft} setTextDraft={setTextDraft} handleTextKeyDown={handleTextKeyDown} multiSelected={multiSelected} toggleMultiSelect1={toggleMultiSelect1} submitT1Multi={submitT1Multi} goBackT1={goBackT1} />
        )}
        <style>{`* { box-sizing: border-box; overflow-anchor: none; } body { margin: 0; } textarea::placeholder { color: rgba(30,26,22,0.3); }`}</style>
      </div>
    );
  }

  // ---- RENDER: CHAT ----
  // Everything after the Initial Reading lands here — one continuous
  // screen for as long as the person wants to keep the conversation
  // going. No separate "waiting to begin" screen, no progress bar, no
  // button that has to be pressed to unlock going deeper — the chat
  // input is just there, always, right under whatever's been said so
  // far. This is also deliberately the ONLY screen state after the
  // reading (not tier1 -> post-initial -> tier2 -> chat, just tier1 ->
  // chat): every one of those old stage transitions was a full layout
  // change with its own fresh mount, and that was the actual root cause
  // behind nearly every scroll bug this app has had. With only one
  // screen after the reading, that whole category of bug has nowhere
  // left to happen.

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: c.bg, color: c.textPrimary, fontFamily: SERIF, display: "flex", flexDirection: "column", paddingTop: "80px" }}>
      <Header onClear={handleClearChat} />
      <Transcript messages={messages} loading={loading} messagesEndRef={messagesEndRef} lastMessageRef={lastMessageRef} scrollContainerRef={scrollContainerRef} copyReadingText={copyReadingText} downloadReadingText={downloadReadingText} copiedIndex={copiedIndex}
        loadingLabel={step === "tier1" && loading ? "Building your Energetic Root Cause reading..." : undefined}
        ctaSlot={
          <>
            <div style={{ textAlign: "center", background: c.accentLight, border: `1px solid ${c.accentMid}`, borderRadius: "8px", padding: "0.6rem 1rem", marginBottom: "0.85rem" }}>
              <div style={{ fontSize: "13.5px", color: c.accent, fontWeight: 700, fontFamily: SANS, letterSpacing: "0.01em" }}>
                The more detail you share, the more precise this gets.
              </div>
            </div>
            <SimpleChatInput
              value={chatDraft}
              onChange={setChatDraft}
              onSubmit={submitChatMessage}
              placeholder="Type a question, a response, or whatever's on your mind..."
              loading={loading}
              handleTextKeyDown={handleTextKeyDown}
            />
            <Disclaimer />
          </>
        }
      />
      <style>{`
        @keyframes bast-pulse { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.8; transform: scale(1); } }
        textarea::placeholder { color: rgba(30,26,22,0.3); }
        * { box-sizing: border-box; overflow-anchor: none; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
