import { query, withHost } from '../strapi';
import { DEFAULT_NEWS_IMAGE, DEFAULT_AUTHOR_AVATAR } from './_mediaDefaults';
import type { NewsArticle, Pagination } from './news';

/**
 * Busca noticias en Strapi por múltiples criterios
 */
export async function searchNews({ query: q, page = 1, pageSize = 20, categoryId }: any) {
	if (!q?.trim() && !categoryId) {
		return { products: [], pagination: undefined };
	}

	const clean = q
		.trim()
		.replace(/[^\w\s\u00C0-\u00FF]/g, ' ')
		.replace(/\s+/g, ' ')
		.toLowerCase();

	const filters =
		`filters[$or][0][titulo][$containsi]=${clean}` +
		`&filters[$or][1][autor][name][$containsi]=${clean}` +
		`&filters[$or][2][autor][cargo][$containsi]=${clean}` +
		`&filters[$or][3][categorias][name][$containsi]=${clean}`;

	let qs =
		`news?${filters}` +
		`&populate[imagenes][fields][0]=url` +
		`&populate[autor][populate][avatar][fields][0]=url` +
		`&populate[autor][fields][0]=name` +
		`&populate[autor][fields][1]=cargo` +
		`&populate[categorias][fields][0]=name` +
		`&sort=updatedAt:desc` +
		`&pagination[page]=${page}` +
		`&pagination[pageSize]=${pageSize}`;

	if (categoryId) {
		qs += `&filters[categorias][slug][$eq]=${categoryId}`;
	}

	const res = await query(qs);

	const products: NewsArticle[] = res.data.map((item: any) => {
		const a = item.attributes ?? item;

		const img = a.imagenes?.data?.attributes?.url ?? a.imagenes?.url ?? null;

		const autor = a.autor?.data?.attributes ?? a.autor ?? {};
		const avatar = autor?.avatar?.data?.attributes?.url ?? autor?.avatar?.url ?? null;

		const date = new Date(a.publishedAt ?? a.updatedAt ?? a.createdAt);

		return {
			titulo: a.titulo ?? '',
			contenido: a.contenido ?? [],
			slug: a.slug ?? '',
			image: img ? withHost(img) : DEFAULT_NEWS_IMAGE,
			dia: date.toLocaleDateString(),
			hora: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			UrlYoutube: a.UrlYoutube ?? null,
			autorName: autor?.name ?? null,
			autorAvatar: avatar ? withHost(avatar) : DEFAULT_AUTHOR_AVATAR,
			autorRol: autor?.cargo ?? null,
			categorias: (a.categorias?.data ?? []).map((c: any) => c.attributes?.name).filter(Boolean)
		};
	});

	return { products, pagination: res.meta?.pagination };
}
