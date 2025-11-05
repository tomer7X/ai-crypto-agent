import express from 'express';

const router = express.Router();

// Tiny helper to call OpenRouter Chat Completions
async function callOpenRouter({ prompt, model, apiKey }) {
  const url = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  // Optional but recommended headers if you have them
  if (process.env.SITE_URL) headers['HTTP-Referer'] = process.env.SITE_URL;
  headers['X-Title'] = process.env.OPENROUTER_TITLE || 'AI Crypto Agent (Local)';

  const body = {
    model: model || 'openrouter/auto',
    messages: [
      { role: 'system', content: 'You are a concise crypto assistant. Keep answers short and useful.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 160,
    temperature: 0.7,
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!resp.ok) {
    let text = '';
    try { text = await resp.text(); } catch { text = '<unreadable body>'; }
    throw new Error(`OpenRouter error ${resp.status}: ${text}`);
  }
  return resp.json();
}

router.post('/', async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) return res.status(500).json({ message: 'OPENROUTER_API_KEY missing' });

    const prompt = (req.body?.prompt && String(req.body.prompt)) || 'Say hello from an AI running via OpenRouter.';
    const model = (req.body?.model && String(req.body.model)) || 'openrouter/auto';

    const data = await callOpenRouter({ prompt, model, apiKey });
    const content = data?.choices?.[0]?.message?.content || '(no content)';

    return res.json({ source: 'openrouter', model: data?.model || model, output: content });
  } catch (error) {
    console.error('Error in POST /api/ai/openrouter:', error);
    return res.status(500).json({ message: 'AI request failed', error: error.message });
  }
});

export default router;
