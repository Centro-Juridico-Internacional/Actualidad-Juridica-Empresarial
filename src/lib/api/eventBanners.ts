import { withHost } from '../strapi';

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
	const res = await fetch(`${STRAPI_HOST}/api/banners-eventos?populate[Banners][fields][0]=url`, {
		cache: 'no-store'
	});

	if (!res.ok) return [];

	const json = await res.json();

	return (json.data ?? [])
		.map((item: any) => {
			const a = item.attributes ?? item;
			const imgRel = a.Banners?.data?.attributes?.url ?? a.Banners?.url ?? null;

			return {
				title: a.slug ?? '',
				slug: a.slug ?? '',
				urlEvento: a.UrlEvento ?? '',
				image: imgRel ? withHost(imgRel) : null
			};
		})
		.filter((b: EventBanner) => b.image && b.urlEvento);
}
