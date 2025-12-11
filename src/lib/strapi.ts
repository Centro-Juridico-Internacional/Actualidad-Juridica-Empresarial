/** Host del servidor Strapi */
const STRAPI_HOST: string = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;

/** Token de autenticación para la API de Strapi */
const STRAPI_TOKEN: string = process.env.STRAPI_TOKEN ?? import.meta.env.STRAPI_TOKEN;

/**
 * Verifica si una URL es absoluta (comienza con http:// o https://)
 * @param url - URL a verificar
 * @returns true si la URL es absoluta, false en caso contrario
 */
function isAbsoluteUrl(url?: string | null): boolean {
	return !!url && /^https?:\/\//i.test(url);
}

/**
 * Convierte una URL relativa en absoluta agregando el host de Strapi
 * @param url - URL relativa o absoluta
 * @returns URL absoluta o null si no se proporciona URL
 */
function withHost(url?: string | null): string | null {
	if (!url) return null;
	return isAbsoluteUrl(url) ? url : `${STRAPI_HOST}${url}`;
}

/**
 * Opciones de configuración para las consultas a la API
 */
interface QueryOptions {
	/** Tiempo de revalidación del caché en segundos */
	revalidate?: number;
}

/**
 * Entrada de caché para almacenar ETag y datos
 */
interface CacheEntry {
	etag: string;
	data: unknown;
	timestamp: number;
}

/** Caché global en memoria (persiste mientras el proceso esté vivo) */
const apiCache = new Map<string, CacheEntry>();

/**
 * Realiza una consulta a la API de Strapi con caché inteligente (ETags)
 * @param path - Ruta de la API (sin incluir /api/)
 * @param options - Opciones de configuración
 * @returns Promesa con los datos de la respuesta en formato JSON
 * @throws Error si la respuesta no es exitosa
 */
export async function query(path: string, options?: QueryOptions): Promise<unknown> {
	const url = `${STRAPI_HOST}/api/${path}`;

	const headers: HeadersInit = {
		Authorization: `Bearer ${STRAPI_TOKEN}`
	};

	// 1. Verificar si tenemos una versión en caché para enviar el ETag
	const cached = apiCache.get(url);
	if (cached?.etag) {
		headers['If-None-Match'] = cached.etag;
	}

	try {
		const res = await fetch(url, {
			headers,
			// Usamos 'no-store' para forzar la petición de red y validar el ETag con el servidor
			cache: 'no-store',
			// Mantenemos next.revalidate como fallback o cero para priorizar la validación
			next: {
				revalidate: 0 // Siempre validamos cambios
			}
		} as RequestInit & { next?: { revalidate?: number } });

		// 2. Manejar 304 Not Modified (Sin cambios)
		if (res.status === 304 && cached) {
			// console.log(`[Cache] HIT (304) para: ${path}`);
			return cached.data;
		}

		if (!res.ok) {
			throw new Error(`Error en la respuesta de la API: ${res.status} ${res.statusText}`);
		}

		// 3. Procesar respuesta nueva (200 OK)
		const data = await res.json();

		// 4. Guardar en caché si hay ETag nuevo
		const newEtag = res.headers.get('ETag');
		if (newEtag) {
			// console.log(`[Cache] UPDATE (200) para: ${path} ETag: ${newEtag}`);
			apiCache.set(url, {
				etag: newEtag,
				data,
				timestamp: Date.now()
			});
		}

		return data;
	} catch (error) {
		console.error('Error al consultar la API de Strapi:', error);
		throw error;
	}
}

export { withHost };
