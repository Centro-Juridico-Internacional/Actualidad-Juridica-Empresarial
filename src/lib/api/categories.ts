import { query, withHost } from '../strapi';

interface Category {
	name: string;
	slug: string;
	description: string;
	image: string | null;
}

interface StrapiCategoryItem {
	attributes?: {
		name?: string;
		slug?: string;
		description?: string;
		imagen?: {
			data?: {
				attributes?: {
					url?: string;
				};
			};
			url?: string;
		};
	};
	name?: string;
	slug?: string;
	description?: string;
	imagen?: {
		data?: {
			attributes?: {
				url?: string;
			};
			url?: string;
		};
	};
}

/**
 * Lista de categorías. Cache ISR por página (categorías, home, etc.).
 */
export async function getCategories(): Promise<Category[]> {
	try {
		const consultaCategories =
			'categories?fields[0]=name&fields[1]=slug&fields[2]=description&populate[imagen][fields][0]=url';

		const respuesta = (await query(consultaCategories)) as {
			data: StrapiCategoryItem[];
		};

		return respuesta.data.map((item: StrapiCategoryItem) => {
			const atributos = item.attributes ?? item;
			const nombre = atributos?.name ?? '';
			const slug = atributos?.slug ?? '';
			const descripcion = atributos?.description ?? '';

			const imagenRelativa =
				atributos?.imagen?.data?.attributes?.url ?? atributos?.imagen?.url ?? null;

			return {
				name: nombre,
				slug,
				description: descripcion,
				image: withHost(imagenRelativa)
			};
		});
	} catch (error) {
		console.error('Error al obtener las categorías:', error);
		throw error;
	}
}
