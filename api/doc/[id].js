module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id || !/^[a-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid ID' });

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: 'KV not configured' });
  }

  const response = await fetch(`${kvUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([['GET', `doc:${id}`]]),
  });

  if (!response.ok) return res.status(500).json({ error: 'Fetch failed' });

  const results = await response.json();
  const raw = results[0]?.result;

  if (!raw) return res.status(404).json({ error: 'Document not found or expired' });

  try {
    const doc = JSON.parse(raw);
    return res.status(200).json(doc);
  } catch {
    return res.status(500).json({ error: 'Invalid data' });
  }
};
