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
 * Realiza una consulta a la API de Strapi
 * @param path - Ruta de la API (sin incluir /api/)
 * @returns Promesa con los datos de la respuesta en formato JSON
 * @throws Error si la respuesta no es exitosa
 */
export async function query(path: string): Promise<unknown> {
	try {
		const res = await fetch(`${STRAPI_HOST}/api/${path}`, {
			headers: {
				Authorization: `Bearer ${STRAPI_TOKEN}`
			},
			// @vercel/edge compatible
			cache: 'no-store'
		});

		if (!res.ok) {
			throw new Error(`Error en la respuesta de la API: ${res.status} ${res.statusText}`);
		}
		return res.json();
	} catch (error) {
		console.error('Error al consultar la API de Strapi:', error);
		throw error;
	}
}

export { withHost };
