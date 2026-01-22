import { query, withHost } from '../strapi';

interface StrapiMediaItem {
	attributes?: {
		url?: string;
	};
	url?: string;
}

interface StrapiMedia {
	data?: StrapiMediaItem | StrapiMediaItem[];
	url?: string;
}

interface Banner {
	nombre: string;
	slug: string;
	banners: string[]; // Arreglo de URLs de imágenes
}

/**
 * Obtiene el Banner Principal del home.
 * Se trata de un Single Type en Strapi que puede contener múltiples imágenes
 * (para slider) o una sola.
 */
export async function getBanner(): Promise<Banner> {
	// Populamos la relación 'imagen' para obtener la media real
	const res = await query('banner?populate=imagen');

	const a = res.data?.attributes ?? res.data ?? {};

	/**
	 * Función recursiva para extraer URLs de imágenes de estructuras Strapi.
	 *
	 * IMPORTANTE:
	 * Strapi 4 y 5 tienen estructuras de respuesta diferentes (con/sin 'attributes').
	 * Además, los campos de medios pueden ser Single (objeto) o Multiple (array).
	 * Esta función normaliza todos esos casos en un array plano de strings.
	 */
	const extractUrls = (media: StrapiMedia): string[] => {
		if (!media) return [];

		// Caso: Array de datos (Strapi 4 multiple)
		if (Array.isArray(media.data)) {
			return media.data
				.map((item: StrapiMediaItem) => withHost(item.attributes?.url ?? item.url))
				.filter((url: string | null): url is string => url !== null);
		}

		// Caso: Array directo (Strapi 5 o configuraciones custom)
		if (Array.isArray(media)) {
			return (media as StrapiMediaItem[])
				.map((item: StrapiMediaItem) => withHost(item.attributes?.url ?? item.url))
				.filter((url: string | null): url is string => url !== null);
		}

		// Caso: Objeto único con data (Strapi 4 single)
		if (media.data && !Array.isArray(media.data)) {
			const url =
				(media.data as StrapiMediaItem).attributes?.url ?? (media.data as StrapiMediaItem).url;
			return url ? [withHost(url)!] : [];
		}

		// Caso: Objeto directo con url
		if (media.url) {
			return [withHost(media.url)!];
		}

		return [];
	};

	const banners = extractUrls(a.imagen);

	return {
		nombre: a.nombre ?? '',
		slug: a.slug ?? '',
		banners
	};
}
