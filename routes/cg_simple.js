import express from 'express';

const router = express.Router();

// GET /api/coins/simple?symbols=btc&vs_currencies=usd
router.get('/', async (req, res) => {
  try {
    const base = (process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3').replace(/\/$/, '');

    const symbols = (req.query.symbols || 'btc').toString();
    const vs = (req.query.vs_currencies || 'usd').toString();

    const params = new URLSearchParams({ symbols, vs_currencies: vs });
    const url = `${base}/simple/price?${params.toString()}`;

    const apiKey = process.env.COINGECKO_API_KEY || '';
    const headers = apiKey ? { 'x-cg-api-key': apiKey } : {};

    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      let body = '';
      try { body = await resp.text(); } catch (_) { body = '<unreadable body>'; }
      return res.status(502).json({ message: 'Upstream CoinGecko error', status: resp.status, url, error: body });
    }

    const data = await resp.json();
    return res.json({ source: 'coingecko_simple', url, data });
  } catch (error) {
    console.error('Error in /api/coins/simple:', error);
    return res.status(500).json({ message: 'Failed to call CoinGecko simple/price', error: error.message });
  }
});

export default router;
