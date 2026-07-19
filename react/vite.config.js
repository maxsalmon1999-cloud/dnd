import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour the port assigned by the preview/launch tooling (PORT env var),
    // falling back to a FIXED 5173 for normal local runs. strictPort means we
    // never silently drift to 5174/5175 — important because the Spotify OAuth
    // redirect URI (http://127.0.0.1:5173/callback) must match exactly.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: !process.env.PORT,
    // Bind the IPv4 loopback explicitly for local runs: Vite's default
    // "localhost" resolves to IPv6 (::1) on this machine, but Spotify's OAuth
    // requires the 127.0.0.1 loopback. (Preview tooling sets PORT — leave its
    // host default alone.)
    ...(process.env.PORT ? {} : { host: '127.0.0.1' }),
  },
})
