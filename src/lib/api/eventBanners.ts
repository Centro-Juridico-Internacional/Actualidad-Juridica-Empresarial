import { withHost } from '../strapi';

/** Host del servidor Strapi */
const STRAPI_HOST: string = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;

/**
 * Representa un banner de evento
 */
export interface EventBanner {
	/** Título del banner */
	title: string;
	/** URL de la imagen del banner */
	image: string | null;
	/** URL del evento */
	urlEvento: string;
	/** Slug del evento */
	slug: string;
}

/**
 * Obtiene la lista de banners de eventos desde Strapi
 * Usa petición pública sin autenticación ya que el endpoint tiene permisos públicos
 * @returns Promesa con el array de banners de eventos
 * @throws Error si la consulta a la API falla
 */
export async function getEventBanners(): Promise<EventBanner[]> {
	try {
		// Hacer petición SIN token de autenticación (como petición pública)
		// Populate solo trae el campo url de Banners para optimizar
		const url = `${STRAPI_HOST}/api/banners-eventos?populate[Banners][fields][0]=url`;

		const res = await fetch(url, {
			cache: 'force-cache',
			next: {
				revalidate: 3600 // 1 hora
			}
		} as RequestInit & { next?: { revalidate?: number } });

		if (!res.ok) {
			console.error('Error al obtener banners de eventos:', res.status, res.statusText);
			return [];
		}

		const respuesta = await res.json();

		if (!respuesta.data || respuesta.data.length === 0) {
			return [];
		}

		return respuesta.data
			.map((item: any) => {
				const urlEvento = item.UrlEvento ?? '';
				const slug = item.slug ?? '';
				const bannerUrl = item.Banners?.url ?? null;

				return {
					title: slug,
					image: withHost(bannerUrl),
					urlEvento,
					slug
				};
			})
			.filter((item: EventBanner) => item.image !== null && item.urlEvento !== '');
	} catch (error) {
		console.error('Error al obtener los banners de eventos:', error);
		return [];
	}
}
