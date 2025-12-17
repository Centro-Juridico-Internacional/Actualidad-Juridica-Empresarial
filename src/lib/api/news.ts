import { query, withHost } from '../strapi';
import { DEFAULT_NEWS_IMAGE, DEFAULT_AUTHOR_AVATAR } from './_mediaDefaults';

/**
 * Type para contenido rich text de Strapi
 */
type StrapiBlockContent = any[];

/** Zona horaria y locale por defecto (Colombia) */
const DEFAULT_TIMEZONE = 'America/Bogota';
const DEFAULT_LOCALE = 'es-CO';

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

/**
 * Transforma un item de Strapi a NewsArticle
 */
function transformNewsItem(item: any): NewsArticle {
	const a = item.attributes ?? item;

	const imageRel = a.imagenes?.data?.attributes?.url ?? a.imagenes?.url ?? null;

	const autor = a.autor?.data?.attributes ?? a.autor ?? {};
	const avatarRel = autor?.avatar?.data?.attributes?.url ?? autor?.avatar?.url ?? null;

	const categoriasRaw = a.categorias;
	const categoriasArr =
		categoriasRaw && 'data' in categoriasRaw
			? (categoriasRaw.data ?? [])
			: Array.isArray(categoriasRaw)
				? categoriasRaw
				: [];

	const categorias = categoriasArr.map((c: any) => c.attributes?.name ?? c?.name).filter(Boolean);

	const fecha = a.publishedAt ?? a.updatedAt ?? a.createdAt ?? new Date().toISOString();
	const date = new Date(fecha);

	return {
		titulo: a.titulo ?? '',
		contenido: a.contenido ?? [],
		slug: a.slug ?? '',
		image: imageRel ? withHost(imageRel) : DEFAULT_NEWS_IMAGE,
		dia: date.toLocaleDateString(DEFAULT_LOCALE, {
			timeZone: DEFAULT_TIMEZONE,
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}),
		hora: date.toLocaleTimeString(DEFAULT_LOCALE, {
			timeZone: DEFAULT_TIMEZONE,
			hour: '2-digit',
			minute: '2-digit'
		}),
		UrlYoutube: a.UrlYoutube ?? null,
		autorName: autor?.name ?? null,
		autorAvatar: avatarRel ? withHost(avatarRel) : DEFAULT_AUTHOR_AVATAR,
		autorRol: autor?.cargo ?? null,
		categorias
	};
}

/**
 * Noticias filtradas por categoría.
 * Cache a nivel de página mediante ISR.
 */
export async function getNews({ categoryId }: GetNewsParams): Promise<NewsResult> {
	const normalized = categoryId?.toLowerCase().trim();

	const qs =
		`news?filters[categorias][slug][$contains]=${encodeURIComponent(normalized)}` +
		`&populate[imagenes][fields][0]=url` +
		`&populate[autor][populate][avatar][fields][0]=url` +
		`&populate[autor][fields][0]=name` +
		`&populate[autor][fields][1]=cargo` +
		`&populate[categorias][fields][0]=name` +
		`&sort=updatedAt:desc`;

	const res = await query(qs);

	return {
		products: res.data.map(transformNewsItem),
		pagination: res.meta?.pagination
	};
}

/**
 * Noticia individual por slug.
 */
export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
	const qs =
		`news?filters[slug][$eq]=${encodeURIComponent(slug)}` +
		`&populate[imagenes][fields][0]=url` +
		`&populate[autor][populate][avatar][fields][0]=url` +
		`&populate[autor][fields][0]=name` +
		`&populate[autor][fields][1]=cargo` +
		`&populate[categorias][fields][0]=name`;

	const res = await query(qs);

	if (!res.data?.length) return null;

	return transformNewsItem(res.data[0]);
}

/**
 * Últimas noticias (para sidebar, secciones, etc.).
 */
export async function getLatestNews(
	limit = 4,
	excludeSlug?: string,
	categorySlugs?: string[]
): Promise<NewsArticle[]> {
	let qs = `news?sort=updatedAt:desc&pagination[limit]=${limit + 1}`;

	if (categorySlugs?.length) {
		categorySlugs.forEach((slug, i) => {
			qs += `&filters[categorias][slug][$in][${i}]=${encodeURIComponent(slug)}`;
		});
	}

	qs +=
		`&populate[imagenes][fields][0]=url` +
		`&populate[autor][populate][avatar][fields][0]=url` +
		`&populate[autor][fields][0]=name` +
		`&populate[autor][fields][1]=cargo` +
		`&populate[categorias][fields][0]=name`;

	const res = await query(qs);

	let items = res.data.map(transformNewsItem);

	if (excludeSlug) {
		items = items.filter((n: NewsArticle) => n.slug !== excludeSlug);
	}

	return items.slice(0, limit);
}
