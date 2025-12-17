import { query, withHost } from '../strapi';
import type { NewsArticle, Pagination } from './news';

const STRAPI_HOST: string = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;
const STRAPI_TOKEN: string = process.env.STRAPI_TOKEN ?? import.meta.env.STRAPI_TOKEN;

/** Imágenes por defecto */
const DEFAULT_NEWS_IMAGE = '/news-default.png';
const DEFAULT_AUTHOR_AVATAR = '/avatar-default.png';

/**
 * Parámetros para la búsqueda de noticias
 */
interface SearchParams {
	/** Término de búsqueda */
	query: string;
	/** Número de página para paginación */
	page?: number;
	/** Cantidad de resultados por página */
	pageSize?: number;
	/** Filtro opcional por categoría (slug) */
	categoryId?: string;
}

/**
 * Resultado de la búsqueda de noticias
 */
interface SearchResult {
	/** Array de artículos encontrados */
	products: NewsArticle[];
	/** Información de paginación */
	pagination?: Pagination;
}

/**
 * Representa un item de autor en Strapi
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
		contenido?: unknown;
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
	contenido?: unknown;
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
 * Respuesta de Strapi para búsqueda de noticias
 */
interface StrapiSearchResponse {
	data: StrapiNewsItem[];
	meta?: {
		pagination?: Pagination;
	};
}

/**
 * Busca noticias en Strapi por múltiples criterios
 * Busca en: título, nombre del autor, rol del autor, y categorías
 *
 * @param params - Parámetros de búsqueda incluyendo el término a buscar
 * @returns Promesa con los resultados de búsqueda y paginación
 * @throws Error si la consulta a la API falla
 */
export async function searchNews({
	query: searchQuery,
	page = 1,
	pageSize = 20,
	categoryId
}: SearchParams): Promise<SearchResult> {
	try {
		if (!searchQuery || searchQuery.trim() === '') {
			// If no search query, but a categoryId is provided, we should still search within that category.
			// If neither is provided, return empty.
			if (!categoryId) {
				return { products: [], pagination: undefined };
			}
		}

		// 1. Limpieza básica: quitar caracteres extraños pero dejar letras, números y espacios
		// También normalizamos espacios múltiples
		const cleanQuery = searchQuery
			.trim()
			.replace(/[^\w\s\u00C0-\u00FF]/g, ' ')
			.replace(/\s+/g, ' ');

		const lowerQuery = cleanQuery.toLowerCase();

		// Función para quitar tildes
		const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		const noAccentQuery = removeAccents(lowerQuery);

		const variations = new Set<string>();
		variations.add(cleanQuery);
		variations.add(lowerQuery);
		variations.add(noAccentQuery);

		// 2. Variaciones de formato (guiones)
		variations.add(lowerQuery.replace(/ /g, '-'));
		variations.add(lowerQuery.replace(/-/g, ' '));
		variations.add(lowerQuery.replace(/-/g, ''));

		// 3. Expansión de Sinónimos y Conceptos Relacionados
		const synonymGroups = [
			{
				triggers: [
					'sg-sst',
					'sgsst',
					'sg sst',
					'gestion',
					'sistema de gestion',
					'sistema de gestión',
					'seguridad y salud',
					'salud en el trabajo'
				],
				expansions: ['sg-sst', 'sgsst', 'Sistema de Gestión de Seguridad y Salud en el Trabajo']
			}
		];

		synonymGroups.forEach((group) => {
			const match = group.triggers.some((trigger) =>
				noAccentQuery.includes(removeAccents(trigger))
			);
			if (match) {
				group.expansions.forEach((term) => variations.add(term));
			}
		});

		const uniqueVariations = Array.from(variations);

		let filterIndex = 0;
		let filtersString = '';

		const fields = [
			'[titulo][$containsi]',
			'[autor][name][$containsi]',
			'[autor][cargo][$containsi]',
			'[categorias][name][$containsi]'
		];

		uniqueVariations.forEach((variation) => {
			if (variation.length < 2) return;

			const encodedVar = encodeURIComponent(variation);
			fields.forEach((field) => {
				filtersString += `&filters[$or][${filterIndex}]${field}=${encodedVar}`;
				filterIndex++;
			});
		});

		let searchQueryString =
			`news?` +
			filtersString +
			`&populate[imagenes][fields][0]=url` +
			`&populate[autor][populate][avatar][fields][0]=url` +
			`&populate[autor][fields][0]=name` +
			`&populate[autor][fields][1]=cargo` +
			`&populate[categorias][fields][0]=name` +
			`&sort=updatedAt:desc` +
			`&pagination[page]=${page}` +
			`&pagination[pageSize]=${pageSize}`;

		if (categoryId && categoryId.trim()) {
			searchQueryString += `&filters[categorias][slug][$eq]=${encodeURIComponent(categoryId.trim())}`;
		}

		const respuesta = (await query(searchQueryString)) as StrapiSearchResponse;

		const noticias = respuesta.data.map((item: StrapiNewsItem) => {
			const atributos = item.attributes ?? item;

			const imagenRelativa =
				atributos?.imagenes?.data?.attributes?.url ?? atributos?.imagenes?.url ?? null;

			const imagenFinal = imagenRelativa
				? `${withHost(imagenRelativa)}?token=${STRAPI_TOKEN}`
				: DEFAULT_NEWS_IMAGE;

			const autor = atributos?.autor?.data?.attributes ?? atributos?.autor ?? {};
			const autorAvatarRelativo =
				autor?.avatar?.data?.attributes?.url ?? autor?.avatar?.url ?? null;

			const autorAvatarFinal = autorAvatarRelativo
				? `${withHost(autorAvatarRelativo)}?token=${STRAPI_TOKEN}`
				: DEFAULT_AUTHOR_AVATAR;

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
				contenido: (atributos?.contenido ?? []) as any[],
				slug: atributos?.slug ?? '',
				image: imagenFinal,
				dia: fechaPublicacion.toLocaleDateString(),
				hora: fechaPublicacion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				UrlYoutube: atributos?.UrlYoutube ?? null,
				autorName: autor?.name ?? null,
				autorAvatar: autorAvatarFinal,
				autorRol: autor?.cargo ?? null,
				categorias
			};
		});

		return { products: noticias, pagination: respuesta?.meta?.pagination };
	} catch (error) {
		console.error('Error al buscar noticias:', error);
		throw error;
	}
}
