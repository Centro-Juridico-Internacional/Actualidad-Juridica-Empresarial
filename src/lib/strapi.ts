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
	/**
	 * @deprecated El caché ahora se maneja vía Vercel ISR (Cache-Control headers).
	 * Esta opción se mantiene por compatibilidad pero no tiene efecto interno.
	 */
	revalidate?: number;
}

/**
 * Realiza una consulta a la API de Strapi.
 * Nota: El caché ya no se maneja en memoria aquí.
 * La estrategia es "On-Demand ISR". Las páginas deben establecer sus propios headers Cache-Control.
 *
 * @param path - Ruta de la API (sin incluir /api/)
 * @param options - Opciones de configuración
 * @returns Promesa con los datos de la respuesta en formato JSON
 * @throws Error si la respuesta no es exitosa
 */
export async function query(path: string, options?: QueryOptions): Promise<unknown> {
	const url = `${STRAPI_HOST}/api/${path}`;

	const headers: HeadersInit = {
		Authorization: `Bearer ${STRAPI_TOKEN}`,
		'Content-Type': 'application/json'
	};

	try {
		// Realizamos fetch sin caché interno ('no-store') asegurnado datos frescos del backend.
		// El caché real ocurrirá en la capa Edge de Vercel (CDN) gracias a los headers de las páginas.
		const res = await fetch(url, {
			headers,
			cache: 'no-store'
		});

		if (!res.ok) {
			throw new Error(`Error en la respuesta de la API: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();
		return data;
	} catch (error) {
		console.error('Error al consultar la API de Strapi:', error);
		throw error;
	}
}

export { withHost };
