// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel/serverless';
import react from '@astrojs/react';
import compress from 'astro-compress';
import { VitePWA } from 'vite-plugin-pwa';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  build: {
    inlineStylesheets: 'auto',
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    imageService: true,
  }),

  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          // Excluir PDFs del precaching (son muy grandes, 6.19 MB)
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // Aumentar el límite de tamaño para otros archivos a 10 MB
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
          runtimeCaching: [
            {
              // Los PDFs se cachean en runtime, no en precache
              urlPattern: /\.pdf$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'pdf-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    build: {
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) {
                return 'react-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    ssr: {
      noExternal: ['@fontsource-variable/*'],
    },
  },

  integrations: [
    react({
      include: ['**/*.tsx', '**/*.jsx'],
    }),
    compress(),
  ],
});