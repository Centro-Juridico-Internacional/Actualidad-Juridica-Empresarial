// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel"; // ⬅️ CAMBIO IMPORTANTE: Adaptador para despliegue en Vercel
import react from "@astrojs/react";
import compress from "astro-compress";
import sitemap from "@astrojs/sitemap";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Configuración Principal de Astro
 * ==============================
 * Define el comportamiento del build, renderizado (SSR) y optimización.
 *
 * Puntos Críticos:
 * 1. Output: 'server' -> Habilita SSR.
 * 2. Adapter: Vercel -> Genera Serverless Functions.
 * 3. ISR: Configuración de caché incremental.
 * 4. PWA: Service Workers para caché offline.
 */
export default defineConfig({
  // URL final de producción (importante para sitemap y canonical URLs)
  site: "https://actualidadfrontend.vercel.app",

  // Renderizado en servidor (SSR) necesario para contenido dinámico de CMS
  output: "server",

  // Configuración ISR (Incremental Static Regeneration) específica de Vercel
  // Permite que las páginas se generen bajo demanda y se cacheen en el Edge
  // @ts-expect-error - La definición de tipos de Vercel ISR podría faltar
  isr: {
    // Token secreto para invalidar caché manualmente desde Strapi/Webhook
    bypassToken: process.env.VERCEL_ISR_BYPASS_TOKEN ?? "",
    // Exclusiones: API y Búsqueda siempre deben ser frescas (no cacheadas por ISR)
    exclude: [/^\/api\//, /^\/buscar/],
  },

  // Prefetching: Carga anticipada de enlaces en viewport para navegación instantánea
  prefetch: true,

  // Configuración de servicio de Imágenes (Astro Assets / Vercel Image Optimization)
  image: {
    domains: [
      // Dominios permitidos para optimización de imágenes externas (Strapi)
      "grounded-positivity-3e23e06907.strapiapp.com",
      "grounded-positivity-3e23e06907.media.strapiapp.com"
    ],
    remotePatterns: [{ protocol: "https", hostname: "**.strapiapp.com" }],
  },

  build: {
    // Inlinea hojas de estilo pequeñas (< 4kb) para reducir peticiones HTTP
    inlineStylesheets: "auto",
  },

  // Adaptador de host (Vercel)
  adapter: vercel({
    webAnalytics: { enabled: true }, // Analytics de Vercel
    imageService: true, // Usa la optimización de imágenes nativa de Vercel
  }),

  vite: {
    plugins: [
      // Integración oficial de TailwindCSS 4.0 (Vite)
      tailwindcss(),
      // Configuración de Progressive Web App (Offline support)
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          // Archivos estáticos a cachear
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB límite
          // Estrategias de caché dinámico (Runtime Caching)
          runtimeCaching: [
            {
              // Cache agresivo para PDFs (Revistas) para mejorar lectura offline
              urlPattern: /\.pdf$/,
              handler: "CacheFirst",
              options: {
                cacheName: "pdf-cache",
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 días
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],

    build: {
      cssCodeSplit: true, // Divide CSS por chunks JS
      minify: "terser",
      terserOptions: { compress: { drop_console: true } }, // Elimina console.log en prod
      rollupOptions: {
        output: {
          // Chunking manual para separar vendors grandes (React)
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
      // Dependencias que NO deben externarse en SSR (se bundlean)
      // Necesario para librerías que usan 'window' o formatos ESM puros
      noExternal: ["@fontsource-variable/*", "@jaymanyoo/pdf-book-viewer", "@emailjs/browser"],
    },
  },

  integrations: [
    // Soporte para React (Components & Islands)
    react({ include: ["**/*.tsx", "**/*.jsx"] }),
    // Sitemap y Compresión solo en Producción (ahorra tiempo en dev)
    ...(process.env.NODE_ENV === "production" ? [sitemap(), compress()] : []),
  ],
});
