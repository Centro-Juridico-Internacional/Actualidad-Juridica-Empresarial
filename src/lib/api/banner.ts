import { query, withHost } from '../strapi';

interface Banner {
	nombre: string;
	slug: string;
	banner: string | null;
}

/**
 * Banner principal del home.
 * Cacheado por ISR en la página que lo use.
 */
export async function getBanner(): Promise<Banner> {
	const res = await query('banner?populate[imagen][fields][0]=url');

	const a = res.data?.attributes ?? res.data ?? {};
	const imgRel = a.imagen?.data?.attributes?.url ?? a.imagen?.url ?? null;

	return {
		nombre: a.nombre ?? '',
		slug: a.slug ?? '',
		banner: imgRel ? withHost(imgRel) : null
	};
}
