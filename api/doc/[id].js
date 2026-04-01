module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id || !/^[a-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid ID' });

  const url   = process.env.UPSTASH_REDIS_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'Database not configured' });

  // Use Upstash pipeline command format: GET key
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['GET', `doc:${id}`]),
  });

  if (!r.ok) return res.status(500).json({ error: 'Fetch failed' });

  const { result } = await r.json();
  if (!result) return res.status(404).json({ error: 'Document not found or expired' });

  try {
    return res.status(200).json(JSON.parse(result));
  } catch {
    return res.status(500).json({ error: 'Invalid data' });
  }
};
