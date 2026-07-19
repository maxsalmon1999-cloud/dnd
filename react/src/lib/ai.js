// ---------------------------------------------------------------------------
// AI client — talks to Claude through the Cloudflare proxy worker.
//
// Mirrors the original app's behaviour:
//  - streaming responses (Server-Sent Events) for the DM prompt flow
//  - non-streaming for one-shot tasks (campaign extraction, session summary)
//  - reports token usage so the budget tracker can estimate cost
// ---------------------------------------------------------------------------
import { WORKER_URL, API_MODEL } from '../config'
import { auth } from '../firebase'

// The proxy only serves the signed-in DM, so every call carries their Firebase
// ID token. Returns just the content-type when signed out (the worker 401s).
async function authHeaders() {
  const user = auth.currentUser
  if (!user) return { 'Content-Type': 'application/json' }
  const token = await user.getIdToken()
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

// One-shot, non-streaming completion. Returns { text, usage }.
// No live callers yet — kept for the one-shot features not yet ported to the
// refreshed DM screen (campaign extraction on setup, AI session summary).
export async function complete({ system, messages, maxTokens = 1024, model = API_MODEL }) {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages,
    }),
  })
  if (!res.ok) throw new Error(`AI worker HTTP ${res.status}`)
  const data = await res.json()
  const text = (data.content || []).map((b) => b.text || '').join('')
  return { text, usage: data.usage || null }
}

// Streaming completion. Calls onToken(chunk) as text arrives.
// Returns { text, usage } once the stream completes.
export async function stream({
  system,
  messages,
  maxTokens = 4096,
  model = API_MODEL,
  onToken,
}) {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      ...(system ? { system } : {}),
      messages,
    }),
  })
  if (!res.ok || !res.body) throw new Error(`AI worker HTTP ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  const usage = { input_tokens: 0, output_tokens: 0 }
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Process complete SSE lines; keep any trailing partial line in the buffer.
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]' || !payload) continue

      let evt
      try {
        evt = JSON.parse(payload)
      } catch {
        continue
      }

      if (evt.type === 'message_start') {
        usage.input_tokens = evt.message?.usage?.input_tokens ?? 0
      } else if (evt.type === 'content_block_delta' && evt.delta?.text) {
        full += evt.delta.text
        onToken?.(evt.delta.text)
      } else if (evt.type === 'message_delta') {
        usage.output_tokens = evt.usage?.output_tokens ?? usage.output_tokens
      }
    }
  }

  return { text: full, usage }
}
