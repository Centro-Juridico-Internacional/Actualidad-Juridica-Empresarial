# 🌐 Actualidad Jurídica - Frontend

Este es el frontend de la plataforma **Actualidad Jurídica**, construido con **Astro v5**, **React** y **TailwindCSS v4**. Diseñado para ofrecer una experiencia de usuario extremadamente rápida, accesible y optimizada para SEO.

## ⚡ Tecnologías & Stack

Un resumen técnico de las herramientas clave para desarrolladores:

### Core Frameworks

- **[Astro v5](https://astro.build/)**: Base del proyecto. Maneja el routing, la generación estática (SSG) y la renderización en el servidor (SSR) mediante el adaptador de Vercel.
- **[React v19](https://react.dev/)**: Utilizado para componentes interactivos (islas) que requieren estado del lado del cliente (carruseles, formularios, buscador).
- **[TailwindCSS v4](https://tailwindcss.com/)**: Motor de estilos. Usamos la versión 4 que se integra vía Vite plugin, eliminando la necesidad de un archivo `tailwind.config.js` complejo.

### Optimización y Performance

- **Edge Caching (ISR)**: Configurado para regenerar páginas estáticas sin reconstruir el sitio completo.
- **Vite PWA**: Plugin para capacidades offline y caching de assets.
- **Sharp**: Procesamiento de imágenes de alto rendimiento.
- **jsPDF & PageFlip**: Para la experiencia de lectura de revistas digitales y descarga de certificados.

### Calidad de Código

- **TypeScript**: Tipado estático para robustez.
- **Prettier**: Formateo de código automático (con plugins para Astro y Tailwind).
- **Husky**: Git hooks para asegurar calidad antes de cada commit.

## 📂 Arquitectura del Proyecto

El código está organizado siguiendo principios de "Feature-based" y "Component-based":

```text
frontend/src/
├── components/          # Bloques de construcción UI
│   ├── common/          # Átomos y moléculas reutilizables (Botones, Cards, Inputs)
│   ├── features/        # Componentes con lógica de negocio específica (NewsCarousel, SearchBar)
│   ├── sections/        # Organismos grandes que forman partes de una página (Header, Footer, Hero)
│   └── ui/              # Elementos básicos de diseño (Iconos, Separadores)
├── layouts/             # Plantillas base (Layout.astro, BaseHead.astro)
├── lib/                 # Lógica no visual
│   ├── strapi.ts        # Cliente API robusto con tipado y manejo de errores
│   └── utils.ts         # Funciones de ayuda (formato de fechas, strings)
├── pages/               # Rutas de la aplicación (File-based routing)
│   ├── [slug].astro     # Ruta dinámica para noticias individuales
│   ├── buscar.astro     # Página de resultados de búsqueda (SSR)
│   └── index.astro      # Homepage
└── styles/              # Definiciones CSS
    └── global.css       # Importaciones de Tailwind y variables CSS custom
```

## 🛠️ Configuración para Desarrolladores

### 1. Variables de Entorno

Crea un archivo `.env` en `frontend/` (no lo subas al repo):

```ini
# Conexión con Strapi
STRAPI_HOST=http://localhost:1337
STRAPI_TOKEN=tu_token_de_lectura_aqui

# ISR (Opcional, solo prod)
VERCEL_ISR_BYPASS_TOKEN=secret_token
```

### 2. Comandos de Desarrollo

| Script            | Uso                                                                 |
| :---------------- | :------------------------------------------------------------------ |
| `npm run dev`     | **Inicia el entorno local.** Accesible en `http://localhost:4321`.  |
| `npm run build`   | Compila el sitio para producción (genera carpeta `.vercel/output`). |
| `npm run preview` | Sirve la versión compilada localmente para testing final.           |
| `npm run astro`   | Ejecuta el CLI de Astro (ej. `npm run astro check`).                |

## 🧐 Solución de Problemas (Troubleshooting)

**1. Las imágenes no cargan**

- Verifica que `STRAPI_HOST` en `.env` sea correcto.
- Si estás en producción, asegúrate de que el dominio de las imágenes (ej. `res.cloudinary.com` o tu dominio de Strapi) esté permitido en `astro.config.mjs` bajo `image.domains`.

**2. Error de CORS al conectar con Strapi**

- Asegúrate de que Strapi (backend) tenga configurados los orígenes permitidos en `config/middlewares.ts` si estás en un entorno diferente a localhost.

**3. Los estilos de Tailwind no aparecen**

- Asegúrate de importar `global.css` en tu Layout principal.
- Verifica que los archivos tengan extensión `.astro`, `.tsx` o `.jsx` para que el compilador los detecte.

## ✅ Pre-Commit Hooks

Este proyecto usa **Husky**. Antes de hacer commit, se ejecutarán validaciones para asegurar que no subas código roto o mal formateado. Si un commit falla, revisa los logs de error en tu terminal.
