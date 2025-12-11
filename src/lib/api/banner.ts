import { query, withHost } from '../strapi';

interface Banner {
	nombre: string;
	slug: string;
	banner: string | null;
}

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
 * Banner principal del home.
 * Cacheado por ISR en la página que lo use.
 */
export async function getBanner(): Promise<Banner> {
	try {
		const respuesta = (await query(
			'banner?populate[imagen][fields][0]=url'
		)) as StrapiBannerResponse;

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
