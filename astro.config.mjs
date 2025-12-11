// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel"; // ⬅️ CAMBIO IMPORTANTE
import react from "@astrojs/react";
import compress from "astro-compress";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  output: "server",

  // @ts-expect-error - Vercel ISR config is valid but missing in Astro types
  isr: {
    bypassToken: process.env.VERCEL_ISR_BYPASS_TOKEN ?? "",
    exclude: [/^\/api\/.+/, /^\/buscar/],
  },


  build: {
    inlineStylesheets: "auto",
  },

  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),

  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /\.pdf$/,
              handler: "CacheFirst",
              options: {
                cacheName: "pdf-cache",
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],

    build: {
      cssCodeSplit: true,
      minify: "terser",
      terserOptions: { compress: { drop_console: true } },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react")) return "react-vendor";
              return "vendor";
            }
          },
        },
      },
    },

    ssr: {
      noExternal: ["@fontsource-variable/*"],
    },
  },

  integrations: [
    react({ include: ["**/*.tsx", "**/*.jsx"] }),
    compress(),
  ],
});
