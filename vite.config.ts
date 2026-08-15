import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    // Image uploads hit the Worker's /api/upload route, not Vite — run `npx wrangler dev`
    // in a second terminal (default port 8787) for uploads to work during `npm run dev`.
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
})
