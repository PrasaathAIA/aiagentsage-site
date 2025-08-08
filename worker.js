// Cloudflare Worker that securely calls the OpenAI Responses API.
//
// Deploy this script via Wrangler (Cloudflare Workers CLI) and add your OpenAI API key
// as a secret named OPENAI_API_KEY. The worker proxies requests from the front-end, adds
// CORS headers, and returns the result.

export default {
  async fetch(req, env) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(req) });
    }
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST' }), {
        status: 405,
        headers: corsHeaders(req)
      });
    }
    try {
      const body = await req.json();
      const { email, agentId, system, prompt } = body || {};
      // Validate required fields
      if (!email || !prompt) {
        return json({ error: 'Missing email or prompt' }, 400, req);
      }

      const payload = {
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: system || 'You are a helpful business agent.' },
          { role: 'user', content: prompt }
        ],
        max_output_tokens: 800
      };

      const upstreamResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!upstreamResponse.ok) {
        const text = await upstreamResponse.text();
        return json({ error: 'Upstream error', detail: text }, upstreamResponse.status, req);
      }
      const data = await upstreamResponse.json();
      // Extract the result from the response. The Responses API may return output_text or an array.
      const result = data.output_text || (Array.isArray(data.output) ? data.output.map(p => p.content?.[0]?.text || '').join('\n') : '');
      return json({ result, agentId }, 200, req);
    } catch (err) {
      return json({ error: err.message }, 500, req);
    }
  }
};

// Helper to generate CORS headers, reflecting the incoming origin
function corsHeaders(req) {
  const origin = req.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  };
}

// Helper to return JSON responses consistently
function json(obj, status, req) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) }
  });
}