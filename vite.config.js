import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server proxy ensures the API key is NOT exposed to the browser in dev.
// Put your key in `.env.local` as `API_ACCESS_KEY=...` (no VITE_ prefix).
// If you need to call the API directly from the browser (not recommended),
// set `VITE_DIRECT_API=true` and `VITE_API_ACCESS_KEY=...` in your env.

export default defineConfig(() => {
  const direct = process.env.VITE_DIRECT_API === 'true';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: direct
        ? undefined
        : {
            // Proxy all /api requests to Bale API and inject the api-access-key header
            '/api': {
              target: 'https://safir.bale.ai',
              changeOrigin: true,
              secure: true,
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => {
                  const key = process.env.API_ACCESS_KEY;
                  const existing = proxyReq.getHeader('api-access-key');
                  if (!existing && key) {
                    proxyReq.setHeader('api-access-key', key);
                  }
                });
              }
            }
          }
    }
  };
});
