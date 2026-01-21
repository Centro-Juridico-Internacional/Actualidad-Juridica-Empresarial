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
 * Banner principal del home (Single Type con múltiples imágenes).
 */
export async function getBanner(): Promise<Banner> {
	// Populamos la imagen para obtener su URL
	const res = await query('banner?populate=imagen');

	const a = res.data?.attributes ?? res.data ?? {};

	/**
	 * Función recursiva para extraer URLs de imágenes de estructuras Strapi
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
