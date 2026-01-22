import { query, withHost } from '../strapi';
import { DEFAULT_CATEGORY_IMAGE } from './_mediaDefaults';

interface Category {
	name: string;
	slug: string;
	description: string;
	image: string | null;
}

/**
 * Listado de Categorías Legales.
 * Se utiliza para la navegación y filtros principales.
 */
export async function getCategories(): Promise<Category[]> {
	const res = await query(
		'categories?fields[0]=name&fields[1]=slug&fields[2]=description&populate[imagen][fields][0]=url'
	);

	return res.data.map((item: any) => {
		const a = item.attributes ?? item;

		const imgRel = a.imagen?.data?.attributes?.url ?? a.imagen?.url ?? null;

		return {
			name: a.name ?? '',
			slug: a.slug ?? '',
			description: a.description ?? '',
			image: imgRel ? withHost(imgRel) : DEFAULT_CATEGORY_IMAGE
		};
	});
}
