module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, content, docTitle } = req.body || {};
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const url   = process.env.UPSTASH_REDIS_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'Database not configured' });

  const id    = Array.from({ length: 12 }, () => Math.random().toString(36)[2]).join('');
  const value = JSON.stringify({ title: title || 'Untitled', content, docTitle: docTitle || '', createdAt: Date.now() });

  // Use Upstash pipeline command format: SET key value EX seconds
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', `doc:${id}`, value, 'EX', 2592000]),
  });

  if (!r.ok) return res.status(500).json({ error: 'Storage failed' });
  return res.status(200).json({ id });
};
