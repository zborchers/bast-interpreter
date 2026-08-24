// Verifies a Checkout session actually completed payment before the app
// unlocks anything. This is the step that makes the paywall real rather
// than cosmetic — the browser reports back a session_id after Stripe
// redirects home, but that alone proves nothing (a session_id could be
// guessed, reused, or the redirect URL could be typed by hand). Retrieving
// the session directly from Stripe with the secret key, and checking
// payment_status server-side, is the actual source of truth.
//
// KNOWN LIMITATION: this project has no database, so there's no record of
// which session_ids have already been redeemed. A user who bookmarks or
// reuses their own successful success_url could re-verify the same paid
// session more than once — in principle regenerating a reading from a
// session_id they already paid with, without paying again. Closing this
// fully requires a small persistent store (Vercel KV or similar) that
// marks a session_id as consumed on first successful verification. Worth
// adding before this sees real traffic; not blocking for an initial test.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { session_id } = req.body || {};
  if (!session_id) {
    return res.status(400).json({ error: "Missing session_id" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured on this deployment" });
  }

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}`,
      { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } }
    );
    const session = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: session.error?.message || "Stripe error retrieving session" });
    }

    const paid = session.payment_status === "paid";
    const tier = session.metadata?.tier || null;

    return res.status(200).json({ paid, tier });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Connection error verifying payment" });
  }
}
