/** Host del servidor Strapi */
const STRAPI_HOST: string = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;

/** Token de autenticación para la API de Strapi */
const STRAPI_TOKEN: string = process.env.STRAPI_TOKEN ?? import.meta.env.STRAPI_TOKEN;

/**
 * Cache en memoria para evitar fetch duplicados en SSR
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
 * Convierte una URL relativa en absoluta agregando el host de Strapi
 */
function withHost(url?: string | null): string | null {
	if (!url) return null;
	return isAbsoluteUrl(url) ? url : `${STRAPI_HOST}${url}`;
}

/**
 * Consulta básica a la API de Strapi.
 *
 * ⚠️ IMPORTANTE:
 * - Siempre hace `cache: 'no-store'` → los datos vienen frescos del backend.
 * - El cache real lo maneja Vercel ISR a nivel de página (HTML cacheado en Edge).
 * - El cache en memoria SOLO evita fetch duplicados en el mismo render SSR.
 */
export async function query(path: string): Promise<any> {
	const url = `${STRAPI_HOST}/api/${path}`;

	const cached = memoryCache.get(url);
	if (cached && Date.now() < cached.expires) {
		return cached.data;
	}

	const headers: HeadersInit = {
		Authorization: `Bearer ${STRAPI_TOKEN}`,
		'Content-Type': 'application/json'
	};

	const res = await fetch(url, { headers, cache: 'no-store' });

	if (!res.ok) {
		throw new Error(`Error en la respuesta de la API: ${res.status}`);
	}

	const json = await res.json();
	memoryCache.set(url, { data: json, expires: Date.now() + CACHE_TTL });

	return json;
}

export { withHost };
