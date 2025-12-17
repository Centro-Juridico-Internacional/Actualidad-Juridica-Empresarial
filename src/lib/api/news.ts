import { query, withHost } from '../strapi';

/**
 * Type para contenido rich text de Strapi
 */
type StrapiBlockContent = any[];

/** Host del servidor Strapi */
const STRAPI_HOST: string = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;

/** Token de autenticación para la API de Strapi */
const STRAPI_TOKEN: string = process.env.STRAPI_TOKEN ?? import.meta.env.STRAPI_TOKEN;

/** Zona horaria y locale por defecto (Colombia) */
const DEFAULT_TIMEZONE = 'America/Bogota';
const DEFAULT_LOCALE = 'es-CO';

/** Imágenes por defecto */
const DEFAULT_NEWS_IMAGE = '/news-default.png';
const DEFAULT_AUTHOR_AVATAR = '/avatar-default.png';

interface GetNewsParams {
	categoryId: string;
}

export interface NewsArticle {
	titulo: string;
	contenido: StrapiBlockContent;
	slug: string;
	image: string | null;
	dia: string;
	hora: string;
	UrlYoutube: string | null;
	autorName: string | null;
	autorAvatar: string | null;
	autorRol: string | null;
	categorias: string[];
}

export interface Pagination {
	page?: number;
	pageSize?: number;
	pageCount?: number;
	total?: number;
}

interface NewsResult {
	products: NewsArticle[];
	pagination?: Pagination;
}

interface StrapiAutor {
	data?: {
		attributes?: {
			name?: string;
			cargo?: string;
			avatar?: {
				data?: {
					attributes?: {
						url?: string;
					};
				};
				url?: string;
			};
		};
	};
	name?: string;
	cargo?: string;
	avatar?: {
		data?: {
			attributes?: {
				url?: string;
			};
		};
		url?: string;
	};
}

interface StrapiCategoria {
	attributes?: {
		name?: string;
	};
	name?: string;
}

interface StrapiNewsItem {
	attributes?: {
		titulo?: string;
		contenido?: StrapiBlockContent;
		slug?: string;
		imagenes?: {
			data?: {
				attributes?: {
					url?: string;
				};
			};
			url?: string;
		};
		autor?: StrapiAutor;
		categorias?:
			| {
					data?: StrapiCategoria[];
			  }
			| StrapiCategoria[];
		UrlYoutube?: string;
		publishedAt?: string;
		updatedAt?: string;
		createdAt?: string;
	};
	titulo?: string;
	contenido?: StrapiBlockContent;
	slug?: string;
	imagenes?: {
		data?: {
			attributes?: {
				url?: string;
			};
		};
		url?: string;
	};
	autor?: StrapiAutor;
	categorias?:
		| {
				data?: StrapiCategoria[];
		  }
		| StrapiCategoria[];
	UrlYoutube?: string;
	publishedAt?: string;
	updatedAt?: string;
	createdAt?: string;
}

interface StrapiNewsResponse {
	data: StrapiNewsItem[];
	meta?: {
		pagination?: Pagination;
	};
}

/**
 * Transforma un item de Strapi a NewsArticle
 */
function transformNewsItem(item: StrapiNewsItem): NewsArticle {
	const atributos = item.attributes ?? item;

	const imagenRelativa =
		atributos?.imagenes?.data?.attributes?.url ?? atributos?.imagenes?.url ?? null;

	const imagenFinal = imagenRelativa
		? `${withHost(imagenRelativa)}?token=${STRAPI_TOKEN}`
		: DEFAULT_NEWS_IMAGE;

	const autor = atributos?.autor?.data?.attributes ?? atributos?.autor ?? {};
	const autorAvatarRelativo = autor?.avatar?.data?.attributes?.url ?? autor?.avatar?.url ?? null;

	const autorAvatarFinal = autorAvatarRelativo
		? `${withHost(autorAvatarRelativo)}?token=${STRAPI_TOKEN}`
		: DEFAULT_AUTHOR_AVATAR;

	const categoriasRaw = atributos?.categorias;
	const categoriasArray =
		categoriasRaw && 'data' in (categoriasRaw as any)
			? ((categoriasRaw as any).data ?? [])
			: Array.isArray(categoriasRaw)
				? categoriasRaw
				: [];

	const categorias: string[] = categoriasArray
		.map((categoria: StrapiCategoria) => categoria.attributes?.name ?? categoria?.name)
		.filter(
			(name: string | undefined): name is string => typeof name === 'string' && name.length > 0
		);

	const fechaPublicada = atributos?.publishedAt ?? atributos?.updatedAt ?? atributos?.createdAt;
	const fechaPublicacion = fechaPublicada ? new Date(fechaPublicada) : new Date();

	return {
		titulo: atributos?.titulo ?? '',
		contenido: atributos?.contenido ?? [],
		slug: atributos?.slug ?? '',
		image: imagenFinal,
		dia: fechaPublicacion.toLocaleDateString(DEFAULT_LOCALE, {
			timeZone: DEFAULT_TIMEZONE,
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}),
		hora: fechaPublicacion.toLocaleTimeString(DEFAULT_LOCALE, {
			timeZone: DEFAULT_TIMEZONE,
			hour: '2-digit',
			minute: '2-digit'
		}),
		UrlYoutube: atributos?.UrlYoutube ?? null,
		autorName: autor?.name ?? null,
		autorAvatar: autorAvatarFinal,
		autorRol: autor?.cargo ?? null,
		categorias
	};
}

/**
 * Noticias filtradas por categoría.
 * Cache a nivel de página mediante ISR.
 */
export async function getNews({ categoryId }: GetNewsParams): Promise<NewsResult> {
	try {
		// Normalize categoryId to lowercase to ensure case-insensitive matching
		const normalizedCategoryId = categoryId ? categoryId.toLowerCase().trim() : '';

		const consultaNoticias =
			`news?` +
			`filters[categorias][slug][$contains]=${encodeURIComponent(normalizedCategoryId)}` +
			`&populate[imagenes][fields][0]=url` +
			`&populate[autor][populate][avatar][fields][0]=url` +
			`&populate[autor][fields][0]=name` +
			`&populate[autor][fields][1]=cargo` +
			`&populate[categorias][fields][0]=name` +
			`&sort=updatedAt:desc`;

		const respuesta = (await query(consultaNoticias)) as StrapiNewsResponse;

		const noticias = respuesta.data.map((item: StrapiNewsItem) => transformNewsItem(item));

		return { products: noticias, pagination: respuesta?.meta?.pagination };
	} catch (error) {
		console.error('Error al obtener las noticias:', error);
		throw error;
	}
}

/**
 * Noticia individual por slug.
 */
export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
	try {
		const consultaNoticia =
			`news?` +
			`filters[slug][$eq]=${encodeURIComponent(slug)}` +
			`&populate[imagenes][fields][0]=url` +
			`&populate[autor][populate][avatar][fields][0]=url` +
			`&populate[autor][fields][0]=name` +
			`&populate[autor][fields][1]=cargo` +
			`&populate[categorias][fields][0]=name`;

		const respuesta = (await query(consultaNoticia)) as StrapiNewsResponse;

		if (!respuesta.data || respuesta.data.length === 0) {
			return null;
		}

		return transformNewsItem(respuesta.data[0]);
	} catch (error) {
		console.error('Error al obtener la noticia por slug:', error);
		throw error;
	}
}

/**
 * Últimas noticias (para sidebar, secciones, etc.).
 */
export async function getLatestNews(
	limit: number = 4,
	excludeSlug?: string,
	categorySlugs?: string[]
): Promise<NewsArticle[]> {
	try {
		let consultaNoticias = `news?` + `sort=updatedAt:desc` + `&pagination[limit]=${limit + 1}`; // Request one extra just in case we filter one out

		// Filter by Categories if provided (matches ANY of the categories)
		if (categorySlugs && categorySlugs.length > 0) {
			categorySlugs.forEach((slug, index) => {
				// Utilizando OR implicitamente al filtrar por el mismo campo con indices, o usamos $in si la version de Strapi lo soporta directo
				// Para mayor compatibilidad construimos: filters[categorias][slug][$in][0]=slug1&filters[categorias][slug][$in][1]=slug2
				consultaNoticias += `&filters[categorias][slug][$in][${index}]=${encodeURIComponent(slug)}`;
			});
		}

		consultaNoticias +=
			`&populate[imagenes][fields][0]=url` +
			`&populate[autor][populate][avatar][fields][0]=url` +
			`&populate[autor][fields][0]=name` +
			`&populate[autor][fields][1]=cargo` +
			`&populate[categorias][fields][0]=name`;

		const respuesta = (await query(consultaNoticias)) as StrapiNewsResponse;

		let noticias = respuesta.data.map((item: StrapiNewsItem) => transformNewsItem(item));

		if (excludeSlug) {
			noticias = noticias.filter((noticia) => noticia.slug !== excludeSlug);
		}

		return noticias.slice(0, limit);
	} catch (error) {
		console.error('Error al obtener las últimas noticias:', error);
		throw error;
	}
}
