/** Host del servidor Strapi */
const STRAPI_HOST: string = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;

/** Token de autenticación para la API de Strapi */
const STRAPI_TOKEN: string = process.env.STRAPI_TOKEN ?? import.meta.env.STRAPI_TOKEN;

/**
 * Caché en memoria (Singleton)
 * ----------------------------
 * Evita peticiones duplicadas idénticas durante el mismo ciclo de vida del servidor (o build).
 * Útil para SSR donde múltiples componentes pueden pedir el mismo recurso simultáneamente.
 */
const memoryCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60_000; // 1 minuto

/**
 * Verifica si una URL es absoluta (comienza con http:// o https://)
 */
function isAbsoluteUrl(url?: string | null): boolean {
	return !!url && /^https?:\/\//i.test(url);
}

/**
 * Normaliza URLs relativas de Strapi
 * Si la URL ya es absoluta, la devuelve tal cual.
 * Si es relativa, le prepende el STRAPI_HOST.
 */
function withHost(url?: string | null): string | null {
	if (!url) return null;
	return isAbsoluteUrl(url) ? url : `${STRAPI_HOST}${url}`;
}

/**
 * Cliente HTTP Base para Strapi
 * =============================
 * Realiza peticiones FETCH a la API Headless.
 *
 * Estrategia de Caché:
 * 1. Nivel Fetch: `cache: 'no-store'` (Siempre fresco desde origen).
 * 2. Nivel Aplicación: `memoryCache` (Deduplicación de corto plazo).
 * 3. Nivel Infraestructura (Vercel): ISR maneja el caché real de las páginas generadas.
 */
export async function query(path: string): Promise<any> {
	const url = `${STRAPI_HOST}/api/${path}`;

	// Comprobar caché en memoria para evitar llamadas redundantes inmediatas
	const cached = memoryCache.get(url);
	if (cached && Date.now() < cached.expires) {
		return cached.data;
	}

	const headers: HeadersInit = {
		Authorization: `Bearer ${STRAPI_TOKEN}`,
		'Content-Type': 'application/json'
	};

	// 'no-store' delega la responsabilidad del caché a Vercel ISR o al cliente
	const res = await fetch(url, { headers, cache: 'no-store' });

	if (!res.ok) {
		throw new Error(`Error en la respuesta de la API: ${res.status}`);
	}

	const json = await res.json();
	// Guardar en caché volátil
	memoryCache.set(url, { data: json, expires: Date.now() + CACHE_TTL });

	return json;
}

export { withHost };
