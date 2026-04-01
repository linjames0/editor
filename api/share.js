const { Redis } = require('@upstash/redis');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, content, docTitle } = req.body || {};
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const redis = Redis.fromEnv();

  const id = Array.from({ length: 12 }, () => Math.random().toString(36)[2]).join('');
  const docData = { title: title || 'Untitled', content, docTitle: docTitle || '', createdAt: Date.now() };

  // Store for 30 days
  await redis.set(`doc:${id}`, JSON.stringify(docData), { ex: 2592000 });

  return res.status(200).json({ id });
};
