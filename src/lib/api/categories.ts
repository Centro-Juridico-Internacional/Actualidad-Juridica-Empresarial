import { query, withHost } from '../strapi';

/**
 * Representa una categoría de contenido
 */
interface Category {
	/** Nombre de la categoría */
	name: string;
	/** Slug de la categoría (para URLs) */
	slug: string;
	/** Descripción de la categoría */
	description: string;
	/** URL de la imagen de la categoría */
	image: string | null;
}

/**
 * Representa un item de categoría retornado por Strapi
 */
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
		};
		url?: string;
	};
}

/**
 * Obtiene la lista de categorías desde Strapi
 * @returns Promesa con el array de categorías
 * @throws Error si la consulta a la API falla
 */
export async function getCategories(): Promise<Category[]> {
	try {
		const consultaCategories =
			'categories?fields[0]=name&fields[1]=slug&fields[2]=description&populate[imagen][fields][0]=url';
		const respuesta = (await query(consultaCategories)) as { data: StrapiCategoryItem[] };

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
