import { query, withHost } from '../strapi';

/**
 * Type for Strapi rich text block content
 * This matches the structure expected by BlocksRenderer from @strapi/blocks-react-renderer
 */
type StrapiBlockContent = any[];

/** Host del servidor Strapi */
const STRAPI_HOST: string = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;

/** Token de autenticación para la API de Strapi */
const STRAPI_TOKEN: string = process.env.STRAPI_TOKEN ?? import.meta.env.STRAPI_TOKEN;

/**
 * Parámetros para obtener noticias
 */
interface GetNewsParams {
	/** ID de la categoría para filtrar noticias */
	categoryId: string;
}

/**
 * Representa un artículo de noticia
 */
export interface NewsArticle {
	/** Título de la noticia */
	titulo: string;
	/** Contenido de la noticia */
	contenido: StrapiBlockContent;
	/** Slug de la noticia (para URLs) */
	slug: string;
	/** URL de la imagen de la noticia */
	image: string | null;
	/** Fecha de publicación */
	dia: string;
	/** Hora de publicación */
	hora: string;
	/** URL de YouTube asociada */
	UrlYoutube: string | null;
	/** Nombre del autor */
	autorName: string | null;
	/** URL del avatar del autor */
	autorAvatar: string | null;
	/** Rol del autor */
	autorRol: string | null;
	/** Array de nombres de categorías */
	categorias: string[];
}

/**
 * Estructura de paginación de Strapi
 */
export interface Pagination {
	page?: number;
	pageSize?: number;
	pageCount?: number;
	total?: number;
}

/**
 * Resultado de la consulta de noticias
 */
interface NewsResult {
	/** Array de artículos de noticias */
	products: NewsArticle[];
	/** Información de paginación */
	pagination?: Pagination;
}

/**
 * Representa la información del autor en Strapi
 */
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

/**
 * Representa una categoría en Strapi
 */
interface StrapiCategoria {
	attributes?: {
		name?: string;
	};
	name?: string;
}

/**
 * Representa un item de noticia retornado por Strapi
 */
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

/**
 * Respuesta de Strapi para noticias
 */
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

	const autor = atributos?.autor?.data?.attributes ?? atributos?.autor ?? {};
	const autorAvatarRelativo = autor?.avatar?.data?.attributes?.url ?? autor?.avatar?.url ?? null;

	// Manejar tanto el formato { data: [] } como el formato directo []
	const categoriasRaw = atributos?.categorias;
	const categoriasArray =
		categoriasRaw && 'data' in categoriasRaw
			? (categoriasRaw.data ?? [])
			: Array.isArray(categoriasRaw)
				? categoriasRaw
				: [];

	const categorias: string[] = categoriasArray
		.map((categoria: StrapiCategoria) => categoria.attributes?.name ?? categoria?.name)
		.filter((name): name is string => typeof name === 'string' && name.length > 0);

	const fechaPublicada = atributos?.publishedAt ?? atributos?.updatedAt ?? atributos?.createdAt;
	const fechaPublicacion = fechaPublicada ? new Date(fechaPublicada) : new Date();

	return {
		titulo: atributos?.titulo ?? '',
		contenido: atributos?.contenido ?? [],
		slug: atributos?.slug ?? '',
		image: imagenRelativa ? `${STRAPI_HOST}${imagenRelativa}?token=${STRAPI_TOKEN}` : null,
		dia: fechaPublicacion.toLocaleDateString(),
		hora: fechaPublicacion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),

		UrlYoutube: atributos?.UrlYoutube ?? null,
		autorName: autor?.name ?? null,
		autorAvatar: autorAvatarRelativo
			? `${STRAPI_HOST}${autorAvatarRelativo}?token=${STRAPI_TOKEN}`
			: null,
		autorRol: autor?.cargo ?? null,
		categorias
	};
}

/**
 * Obtiene noticias filtradas por categoría desde Strapi
 * @param params - Parámetros de búsqueda incluyendo el ID de categoría
 * @returns Promesa con el array de noticias y la información de paginación
 * @throws Error si la consulta a la API falla
 */
export async function getNews({ categoryId }: GetNewsParams): Promise<NewsResult> {
	try {
		const consultaNoticias =
			`news?` +
			`filters[categorias][slug][$contains]=${encodeURIComponent(categoryId ?? '')}` +
			`&populate[imagenes][fields][0]=url` +
			`&populate[autor][populate][avatar][fields][0]=url` +
			`&populate[autor][fields][0]=name` +
			`&populate[autor][fields][1]=cargo` +
			`&populate[categorias][fields][0]=name` +
			`&sort=updatedAt:desc`;

		const respuesta = (await query(consultaNoticias, { revalidate: 900 })) as StrapiNewsResponse;

		const noticias = respuesta.data.map((item: StrapiNewsItem) => transformNewsItem(item));

		return { products: noticias, pagination: respuesta?.meta?.pagination };
	} catch (error) {
		console.error('Error al obtener las noticias:', error);
		throw error;
	}
}

/**
 * Obtiene un artículo de noticia específico por su slug
 * @param slug - Slug del artículo a obtener
 * @returns Promesa con el artículo de noticia o null si no se encuentra
 * @throws Error si la consulta a la API falla
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

		const respuesta = (await query(consultaNoticia, { revalidate: 900 })) as StrapiNewsResponse;

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
 * Obtiene las últimas noticias (por defecto 4)
 * @param limit - Número de noticias a obtener (por defecto 4)
 * @param excludeSlug - Slug de una noticia a excluir de los resultados
 * @returns Promesa con el array de últimas noticias
 * @throws Error si la consulta a la API falla
 */
export async function getLatestNews(
	limit: number = 4,
	excludeSlug?: string
): Promise<NewsArticle[]> {
	try {
		let consultaNoticias =
			`news?` +
			`pagination[limit]=${limit + (excludeSlug ? 1 : 0)}` + // Obtener uno más si se va a excluir
			`&populate[imagenes][fields][0]=url` +
			`&populate[autor][populate][avatar][fields][0]=url` +
			`&populate[autor][fields][0]=name` +
			`&populate[autor][fields][1]=cargo` +
			`&populate[categorias][fields][0]=name` +
			`&sort=updatedAt:desc`;

		const respuesta = (await query(consultaNoticias, { revalidate: 900 })) as StrapiNewsResponse;

		let noticias = respuesta.data.map((item: StrapiNewsItem) => transformNewsItem(item));

		// Excluir el artículo actual si se especifica
		if (excludeSlug) {
			noticias = noticias.filter((noticia) => noticia.slug !== excludeSlug);
		}

		// Asegurar que devolvemos exactamente el límite solicitado
		return noticias.slice(0, limit);
	} catch (error) {
		console.error('Error al obtener las últimas noticias:', error);
		throw error;
	}
}
