// Creates a Stripe Checkout session for one of two fixed tiers. Uses inline
// price_data rather than pre-created Stripe Products/Prices, so there's
// nothing to set up in the Stripe dashboard beyond the account itself and
// an API key — consistent with how this project avoids config surface
// area anywhere else (see chat.js, which needs only ANTHROPIC_API_KEY).
//
// This calls Stripe's REST API directly with fetch rather than pulling in
// the Stripe SDK as a dependency, for the same reason chat.js talks to
// Anthropic directly: one less package to install, update, and trust.

const TIERS = {
  initial: { amountCents: 500, name: "Energetic Root Cause Reading" },
  unlimited: { amountCents: 2500, name: "Unlimited Follow-Up Conversation" },
};

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

  const { tier } = req.body || {};
  const config = TIERS[tier];
  if (!config) {
    return res.status(400).json({ error: "Invalid tier — must be 'initial' or 'unlimited'" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured on this deployment" });
  }

  try {
    // req.headers.origin is present for same-origin browser requests; the
    // host header is the fallback for any environment where origin isn't
    // forwarded. Either way this builds an absolute URL back to whatever
    // domain the app is actually running on, so success/cancel redirects
    // work correctly on a Vercel preview URL, a custom domain, or
    // localhost during development.
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const params = new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": config.name,
      "line_items[0][price_data][unit_amount]": String(config.amountCents),
      "line_items[0][quantity]": "1",
      "metadata[tier]": tier,
      success_url: `${origin}/?paid=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=${tier}`,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const session = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: session.error?.message || "Stripe error creating session" });
    }

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Connection error creating checkout session" });
  }
}
