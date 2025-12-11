import { withHost } from '../strapi';

/** Host del servidor Strapi */
const STRAPI_HOST: string = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;

export interface EventBanner {
	title: string;
	image: string | null;
	urlEvento: string;
	slug: string;
}

/**
 * Banners de eventos
 * Petición pública sin cache (cachea ISR)
 */
export async function getEventBanners(): Promise<EventBanner[]> {
	try {
		const url = `${STRAPI_HOST}/api/banners-eventos?populate[Banners][fields][0]=url`;

		const res = await fetch(url, {
			cache: 'no-store'
		});

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
				const attrs = item.attributes ?? item;

				const urlEvento = attrs.UrlEvento ?? '';
				const slug = attrs.slug ?? '';

				const bannerUrl = attrs.Banners?.data?.attributes?.url ?? attrs.Banners?.url ?? null;

				return {
					title: slug,
					image: bannerUrl ? withHost(bannerUrl) : null,
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
