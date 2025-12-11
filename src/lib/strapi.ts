/** Host del servidor Strapi */
const STRAPI_HOST: string = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;

/** Token de autenticación para la API de Strapi */
const STRAPI_TOKEN: string = process.env.STRAPI_TOKEN ?? import.meta.env.STRAPI_TOKEN;

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
 * - Por eso aquí NO usamos timers ni `revalidate` ni caché en memoria.
 */
export async function query(path: string): Promise<any> {
	const url = `${STRAPI_HOST}/api/${path}`;

	const headers: HeadersInit = {
		Authorization: `Bearer ${STRAPI_TOKEN}`,
		'Content-Type': 'application/json'
	};

	try {
		const res = await fetch(url, {
			headers,
			cache: 'no-store'
		});

		if (!res.ok) {
			throw new Error(`Error en la respuesta de la API: ${res.status} ${res.statusText}`);
		}

		return await res.json();
	} catch (error) {
		console.error('Error al consultar la API de Strapi:', error);
		throw error;
	}
}

export { withHost };
