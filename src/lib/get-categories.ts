import { query, withHost } from './strapi';

export async function getCategories() {
	const res = await query(
		'categories?fields[0]=name&fields[1]=slug&fields[2]=description&populate[imagen][fields][0]=url'
	);

	return res.data.map((item: any) => {
		const a = item.attributes ?? item;
		const name = a?.name ?? '';
		const slug = a?.slug ?? '';
		const description = a?.description ?? '';

		const imgRel = a?.imagen?.data?.attributes?.url ?? a?.imagen?.url ?? null;

		return {
			name,
			slug,
			description,
			image: withHost(imgRel)
		};
	});
}
