import { query, withHost } from '../strapi';

/**
 * Representa la información del banner principal
 */
interface Banner {
	/** Nombre del banner */
	nombre: string;
	/** Slug del banner */
	slug: string;
	/** URL de la imagen del banner */
	banner: string | null;
}

/**
 * Representa la respuesta de Strapi para el banner (single type)
 */
interface StrapiBannerResponse {
	data?: {
		attributes?: {
			nombre?: string;
			slug?: string;
			imagen?: {
				data?: {
					attributes?: {
						url?: string;
					};
				};
				url?: string;
			};
		};
		nombre?: string;
		slug?: string;
		imagen?: {
			data?: {
				attributes?: {
					url?: string;
				};
			};
			url?: string;
		};
	};
}

/**
 * Obtiene la información del banner principal desde Strapi
 * @returns Promesa con los datos del banner
 * @throws Error si la consulta a la API falla
 */
export async function getBanner(): Promise<Banner> {
	try {
		const respuesta = (await query(
			'banner?populate[imagen][fields][0]=url'
		)) as StrapiBannerResponse;

		// Strapi single type: res.data.attributes contiene los campos
		const atributos = respuesta.data?.attributes ?? respuesta.data ?? {};
		const nombre = atributos?.nombre ?? '';
		const slug = atributos?.slug ?? '';
		const imagenRelativa =
			atributos?.imagen?.data?.attributes?.url ?? atributos?.imagen?.url ?? null;

		return {
			nombre,
			slug,
			banner: withHost(imagenRelativa)
		};
	} catch (error) {
		console.error('Error al obtener el banner:', error);
		throw error;
	}
}
