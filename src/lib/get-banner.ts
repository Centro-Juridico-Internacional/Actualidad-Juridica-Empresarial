import { query, withHost } from './strapi';

export async function getBanner() {
	const res = await query('banner?populate[imagen][fields][0]=url');

	// Strapi single type: res.data.attributes contiene los campos
	const a = res.data?.attributes ?? res.data ?? {};
	const nombre = a?.nombre ?? '';
	const slug = a?.slug ?? '';
	const imgRel = a?.imagen?.data?.attributes?.url ?? a?.imagen?.url ?? null;

	return {
		nombre,
		slug,
		banner: withHost(imgRel)
	};
}
