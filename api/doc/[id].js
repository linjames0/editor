const { Redis } = require('@upstash/redis');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id || !/^[a-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Invalid ID' });

  const redis = Redis.fromEnv();

  const raw = await redis.get(`doc:${id}`);
  if (!raw) return res.status(404).json({ error: 'Document not found or expired' });

  try {
    const doc = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return res.status(200).json(doc);
  } catch {
    return res.status(500).json({ error: 'Invalid data' });
  }
};
