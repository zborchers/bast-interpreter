export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { license_key, product_permalink } = req.body || {};

  if (!license_key || !product_permalink) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ license_key, product_permalink }),
    });
    const data = await response.json();
    return res.status(200).json({ success: data.success === true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
