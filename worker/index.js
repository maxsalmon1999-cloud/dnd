// Cloudflare Worker: Anthropic API proxy for the D&D Session Manager.
// Holds the API key (env.ANTHROPIC_API_KEY) so the browser app never sees it.
//
// Hardening:
//  - AUTH: every request must carry a Firebase ID token (Authorization: Bearer),
//    verified via Google, and the account's email must match DM_EMAIL. So only
//    the signed-in DM can spend credits — a leaked worker URL is useless.
//  - only browser origins on the allowlist may use the proxy;
//  - the model must be a claude-* model and max_tokens is capped.
//
// Config (wrangler.toml [vars]): FIREBASE_API_KEY, DM_EMAIL.
// Secret (wrangler secret put ANTHROPIC_API_KEY): ANTHROPIC_API_KEY.

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

// Keep in sync with react/src/config.js (API_MODEL) and the deploy origins.
const ALLOWED_ORIGINS = [
  'https://dnd-react.pages.dev',
  'http://127.0.0.1:5173', // local dev (pinned port — see vite.config.js)
  'http://localhost:5173',
];
const isAllowedOrigin = (origin) =>
  ALLOWED_ORIGINS.includes(origin) ||
  /^https:\/\/[a-z0-9-]+\.dnd-react\.pages\.dev$/.test(origin || ''); // Pages preview deploys

const ALLOWED_MODEL_PREFIX = 'claude-';
const MAX_TOKENS_CAP = 8192;

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

const jsonError = (origin, status, message) =>
  new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });

// Verify a Firebase ID token and return its verified email (lowercased), or null.
// Google's Identity Toolkit checks the signature + expiry for us — no crypto here.
async function verifiedEmail(idToken, apiKey) {
  if (!idToken || !apiKey) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.users && data.users[0];
    if (!user || user.emailVerified !== true || !user.email) return null;
    return String(user.email).toLowerCase();
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (!isAllowedOrigin(origin)) {
      return new Response('Forbidden', { status: 403 });
    }
    const CORS = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    // Require a signed-in DM. The client sends its Firebase ID token.
    const authz = request.headers.get('Authorization') || '';
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    const email = await verifiedEmail(idToken, env.FIREBASE_API_KEY);
    if (!email || email !== String(env.DM_EMAIL || '').toLowerCase()) {
      return jsonError(origin, 401, 'Sign in as the DM to use the AI');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError(origin, 400, 'Request body is not valid JSON');
    }
    if (!body || typeof body.model !== 'string' || !body.model.startsWith(ALLOWED_MODEL_PREFIX)) {
      return jsonError(origin, 400, 'Unsupported model');
    }
    body.max_tokens = Math.min(body.max_tokens || 1024, MAX_TOKENS_CAP);
    const isStream = body.stream === true;

    let res;
    try {
      res = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      // Without this, a thrown error returns a 500 with no CORS headers and
      // the browser reports an opaque CORS failure instead of the real cause.
      return jsonError(origin, 502, 'Upstream request failed: ' + err.message);
    }

    if (isStream) {
      // Pass through the SSE stream directly
      return new Response(res.body, {
        status: res.status,
        headers: {
          ...CORS,
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
        ...CORS,
        'Content-Type': 'application/json',
      },
    });
  },
};
