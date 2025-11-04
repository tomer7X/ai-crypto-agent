import express from 'express';
import fs from 'fs/promises';

const router = express.Router();

// Simple in-memory cache to reduce API calls
let cache = {
  ts: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
  data: null
};

// Helper: build CryptoPanic URL
function buildCryptoPanicUrl(query = {}) {
  const base = process.env.CRYPTOPANIC_BASE_URL || 'https://cryptopanic.com/api/developer/v2/posts/';
  const apiKey = process.env.CRYPTOPANIC_API_KEY || '';
  const params = new URLSearchParams();
  params.set('auth_token', apiKey);

  // allow optional query params forwarded from client
  // e.g. ?filter=hot&kind=news&public=true
  for (const [k, v] of Object.entries(query)) {
    // skip internal params
    if (!v) continue;
    params.set(k, v);
  }

  return `${base}?${params.toString()}`;
}

// GET / - fetch Cryptopanic posts (server-side proxy)
router.get('/', async (req, res) => {
  try {
    // Serve from cache if still valid
    const now = Date.now();
    if (cache.data && (now - cache.ts) < cache.ttl) {
      return res.json({ source: 'cache', data: cache.data });
    }

    const apiKey = process.env.CRYPTOPANIC_API_KEY;
    const url = buildCryptoPanicUrl(req.query);

    console.log("url", url);

    // If no API key configured, return fallback static JSON
    if (!apiKey) {
      const fallbackPath = new URL('../db/static/cryptopanic_fallback.json', import.meta.url).pathname;
      const raw = await fs.readFile(fallbackPath, 'utf-8');
      const parsed = JSON.parse(raw);
      cache = { ts: now, ttl: cache.ttl, data: parsed };
      return res.json({ source: 'fallback', data: parsed });
    }

    // Fetch from CryptoPanic
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      // Try fallback if API returns error
      console.error('CryptoPanic API error:', response.status, await response.text());
      const fallbackPath = new URL('../db/static/cryptopanic_fallback.json', import.meta.url).pathname;
      const raw = await fs.readFile(fallbackPath, 'utf-8');
      const parsed = JSON.parse(raw);
      cache = { ts: now, ttl: cache.ttl, data: parsed };
      return res.status(502).json({ source: 'fallback', error: 'CryptoPanic API error', data: parsed });
    }

    const data = await response.json();

    // Store in cache
    cache = { ts: now, ttl: cache.ttl, data };

    return res.json({ source: 'cryptopanic', data });
  } catch (error) {
    console.error('Error in /api/news/cryptopanic:', error);
    try {
      const fallbackPath = new URL('../db/static/cryptopanic_fallback.json', import.meta.url).pathname;
      const raw = await fs.readFile(fallbackPath, 'utf-8');
      const parsed = JSON.parse(raw);
      return res.status(500).json({ source: 'fallback', error: error.message, data: parsed });
    } catch (fsErr) {
      return res.status(500).json({ error: 'Failed to fetch news and fallback unavailable', detail: fsErr.message });
    }
  }
});

export default router;
