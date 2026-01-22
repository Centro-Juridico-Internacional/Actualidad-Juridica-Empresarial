import { query, withHost } from '../strapi';
import { DEFAULT_NEWS_IMAGE, DEFAULT_AUTHOR_AVATAR } from './_mediaDefaults';

/**
 * Tipo para contenido rich text de Strapi
 * Puede ser string (Markdown) o array de bloques (Rich Text V2)
 */
type StrapiBlockContent = string | any[];

/** Zona horaria y locale por defecto (Colombia) */
const DEFAULT_TIMEZONE = 'America/Bogota';
const DEFAULT_LOCALE = 'es-CO';

interface GetNewsParams {
	categoryId: string;
}

/**
 * Modelo de Dominio: Artículo de Noticia
 * Unifica la respuesta de Strapi en una estructura limpia para el frontend.
 */
export interface NewsArticle {
	title: string;
	content: StrapiBlockContent;
	slug: string;
	image: string | null;
	day: string;
	time: string;
	youtubeUrl: string | null;
	authorName: string | null;
	authorAvatar: string | null;
	authorRole: string | null;
	categories: string[];
	publishedAt: string | null;
	updatedAt: string | null;
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
 * Transforma un item crudo de Strapi a NewsArticle
 * Maneja la complejidad de extraer atributos anidados (data.attributes vs flatted).
 *
 * @param item Objeto JSON crudo de Strapi
 */
function transformNewsItem(item: any): NewsArticle {
	const a = item.attributes ?? item;

	// Resolución segura de imágenes anidadas
	const imageRel = a.imagenes?.data?.attributes?.url ?? a.imagenes?.url ?? null;

	const autor = a.autor?.data?.attributes ?? a.autor ?? {};
	const avatarRel = autor?.avatar?.data?.attributes?.url ?? autor?.avatar?.url ?? null;

	// Normalización de categorías (array de relaciones)
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
		title: a.titulo ?? '',
		content: a.contenido ?? '', // RichText o Markdown
		slug: a.slug ?? '',
		image: imageRel ? withHost(imageRel) : DEFAULT_NEWS_IMAGE,
		day: date.toLocaleDateString(DEFAULT_LOCALE, {
			timeZone: DEFAULT_TIMEZONE,
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}),
		time: date.toLocaleTimeString(DEFAULT_LOCALE, {
			timeZone: DEFAULT_TIMEZONE,
			hour: '2-digit',
			minute: '2-digit'
		}),
		youtubeUrl: a.UrlYoutube ?? null,
		authorName: autor?.name ?? null,
		authorAvatar: avatarRel ? withHost(avatarRel) : DEFAULT_AUTHOR_AVATAR,
		authorRole: autor?.cargo ?? null,
		categories: categorias,
		publishedAt: a.publishedAt ?? null,
		updatedAt: a.updatedAt ?? null
	};
}

/**
 * Obtiene noticias filtradas por categoría.
 * Construye una query compleja con 'populate' profundo para traer imágenes y autores.
 *
 * @param categoryId Slug de la categoría (ej: 'laboral').
 */
export async function getNews({ categoryId }: GetNewsParams): Promise<NewsResult> {
	const normalized = categoryId?.toLowerCase().trim();

	// Construcción manual de query string (performance optimizada vs SDK)
	const qs =
		`news?filters[categorias][slug][$contains]=${encodeURIComponent(normalized)}` +
		`&populate[imagenes][fields][0]=url` +
		`&populate[autor][populate][avatar][fields][0]=url` +
		`&populate[autor][fields][0]=name` +
		`&populate[autor][fields][1]=cargo` +
		`&populate[categorias][fields][0]=name` +
		`&fields[0]=titulo&fields[1]=contenido&fields[2]=slug&fields[3]=UrlYoutube&fields[4]=publishedAt&fields[5]=updatedAt` +
		`&sort=updatedAt:desc`;

	const res = await query(qs);

	return {
		products: res.data.map(transformNewsItem),
		pagination: res.meta?.pagination
	};
}

/**
 * Busca una noticia individual por su Slug único.
 */
export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
	const qs =
		`news?filters[slug][$eq]=${encodeURIComponent(slug)}` +
		`&populate[imagenes][fields][0]=url` +
		`&populate[autor][populate][avatar][fields][0]=url` +
		`&populate[autor][fields][0]=name` +
		`&populate[autor][fields][1]=cargo` +
		`&populate[categorias][fields][0]=name` +
		`&fields[0]=titulo&fields[1]=contenido&fields[2]=slug&fields[3]=UrlYoutube&fields[4]=publishedAt&fields[5]=updatedAt`;

	const res = await query(qs);

	if (!res.data?.length) return null;

	return transformNewsItem(res.data[0]);
}

/**
 * Obtiene las últimas noticias generales.
 * Útil para secciones de "Recientes" o Sidebar.
 *
 * @param limit Cantidad máxima de items.
 * @param excludeSlug (Opcional) Slug de noticia a excluir (para no repetirla en relaciones).
 * @param categorySlugs (Opcional) Array de categorías para filtrar.
 */
export async function getLatestNews(
	limit = 4,
	excludeSlug?: string,
	categorySlugs?: string[]
): Promise<NewsArticle[]> {
	// Pedimos limit + 1 para tener buffer si excluimos una
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
		`&populate[categorias][fields][0]=name` +
		`&fields[0]=titulo&fields[1]=contenido&fields[2]=slug&fields[3]=UrlYoutube&fields[4]=publishedAt&fields[5]=updatedAt`;

	const res = await query(qs);

	let items = res.data.map(transformNewsItem);

	if (excludeSlug) {
		items = items.filter((n: NewsArticle) => n.slug !== excludeSlug);
	}

	return items.slice(0, limit);
}
