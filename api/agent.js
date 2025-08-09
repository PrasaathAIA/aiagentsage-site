// api/agent.js
export default async function handler(req, res) {
  // CORS (preflight)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return json(res, { error: 'Use POST' }, 405, req);
  }

  try {
    const { email, agentId, system, prompt } = req.body || {};
    if (!email || !prompt) return json(res, { error: 'Missing email or prompt' }, 400, req);

    const payload = {
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: system || 'You are a helpful business agent.' },
        { role: 'user', content: prompt }
      ],
      max_output_tokens: 800
    };

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const detail = await r.text();
      return json(res, { error: 'OpenAI error', detail }, r.status, req);
    }

    const data = await r.json();
    const result =
      data.output_text ||
      (Array.isArray(data.output)
        ? data.output.map(p => p.content?.[0]?.text || '').join('\n')
        : '') ||
      '';

    return json(res, { result, agentId }, 200, req);
  } catch (e) {
    return json(res, { error: e.message }, 500, req);
  }
}

function json(res, obj, status, req) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  return res.status(status).send(JSON.stringify(obj));
}
