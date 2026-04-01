module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, content, docTitle } = req.body || {};
  if (!content) return res.status(400).json({ error: 'Content is required' });

  // Generate a random 12-char alphanumeric ID
  const id = Array.from({ length: 12 }, () => Math.random().toString(36)[2]).join('');

  const docData = JSON.stringify({
    title: title || 'Untitled',
    content,
    docTitle: docTitle || '',
    createdAt: Date.now(),
  });

  // Store in Vercel KV via Upstash REST API — expires in 30 days
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'KV not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN environment variables in your Vercel project.' });
  }

  const response = await fetch(`${kvUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([['SET', `doc:${id}`, docData, 'EX', 2592000]]),
  });

  if (!response.ok) {
    const detail = await response.text();
    return res.status(500).json({ error: 'Storage failed', detail });
  }

  return res.status(200).json({ id });
};
