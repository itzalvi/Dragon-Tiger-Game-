import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  const devPwaCleanupPlugin = {
    name: 'dev-pwa-cleanup',
    apply: 'serve' as const,
    configureServer(server: {
      middlewares: {
        use: (
          fn: (
            req: { url?: string },
            res: {
              statusCode: number;
              setHeader: (k: string, v: string) => void;
              end: (body?: string) => void;
            },
            next: () => void
          ) => void
        ) => void;
      };
    }) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0];

        // If a stale browser cache / SW still requests the virtual dev SW entry point,
        // return a safe module that unregisters old service workers without touching import.meta.hot.
        if (pathname === '/@vite-plugin-pwa/pwa-entry-point-loaded') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(`
export default function registerDevSW() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
  }
  if (typeof caches !== 'undefined') {
    caches.keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .catch(() => {});
  }
}
`);
          return;
        }

        // Serve a clean, HMR-safe Service Worker in dev mode so Chrome triggers
        // native "Install App / Add to Home screen" (beforeinstallprompt) without @vite-plugin-pwa HMR crashes.
        if (pathname === '/dev-sw.js' || pathname === '/sw.js') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('Service-Worker-Allowed', '/');
          res.end(`
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
`);
          return;
        }

        next();
      });
    },
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      devPwaCleanupPlugin,
      ...(isBuild
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              injectRegister: 'auto',
              useCredentials: true,
              manifest: false,
              includeAssets: [
                'favicon.ico',
                'apple-touch-icon.png',
                'manifest.webmanifest',
                'pwa-192x192.png',
                'pwa-512x512.png',
                'pwa-maskable-512x512.png',
                'assets/**/*',
              ],
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2,webmanifest}'],
                globIgnores: ['**/assets/aistudio/**'],
                maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
