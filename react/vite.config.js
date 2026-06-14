import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour the port assigned by the preview/launch tooling (PORT env var),
    // falling back to Vite's default for normal local runs.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
