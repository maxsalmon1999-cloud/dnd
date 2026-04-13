const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const OPENAI_EMBEDDINGS_API = 'https://api.openai.com/v1/embeddings';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method === 'GET' && url.pathname === '/capabilities') {
      return new Response(JSON.stringify({
        anthropic: Boolean(env.ANTHROPIC_API_KEY),
        embeddings: Boolean(env.OPENAI_API_KEY),
      }), {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    if (url.pathname === '/embeddings') {
      if (!env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: { message: 'OPENAI_API_KEY is not configured' } }), {
          status: 500,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
        });
      }

      const body = await request.json();
      const res = await fetch(OPENAI_EMBEDDINGS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    }

    const body = await request.json();
    const isStream = body.stream === true;

    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (isStream) {
      // Pass through the SSE stream directly
      return new Response(res.body, {
        status: res.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Non-streaming: return JSON response
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  },
};
