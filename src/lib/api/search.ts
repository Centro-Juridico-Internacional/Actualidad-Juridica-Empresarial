// Capa de Servicios y Tipos de Datos
import { query, withHost } from '../strapi';
import { DEFAULT_NEWS_IMAGE, DEFAULT_AUTHOR_AVATAR } from './_mediaDefaults';
import type { NewsArticle } from './news';

/**
 * Motor de Búsqueda de Noticias.
 * Busca coincidencias parciales (containsi) en múltiples campos:
 * - Título
 * - Nombre del Autor
 * - Cargo del Autor
 * - Nombre de Categoría
 */
export async function searchNews({ query: q, page = 1, pageSize = 20, categoryId }: any) {
	// Si no hay query ni categoría, retornamos vacío para no saturar
	if (!q?.trim() && !categoryId) {
		return { products: [], pagination: undefined };
	}

	// Sanitización de Query String
	// 1. Elimina caracteres especiales salvo letras, números y espacios
	// 2. Colapsa espacios múltiples
	// 3. Convierte a minúsculas para búsqueda case-insensitive
	const clean = q
		.trim()
		.replace(/[^\w\s\u00C0-\u00FF]/g, ' ') // \u00C0-\u00FF incluye acentos latinos
		.replace(/\s+/g, ' ')
		.toLowerCase();

	// Construcción de filtros OR (alguno debe coincidir)
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

	// Filtro adicional estricto por Categoría si existe
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
			title: a.titulo ?? '',
			content: a.contenido ?? [],
			slug: a.slug ?? '',
			image: img ? withHost(img) : DEFAULT_NEWS_IMAGE,
			day: date.toLocaleDateString('es-CO'),
			time: date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
			youtubeUrl: a.UrlYoutube ?? null,
			authorName: autor?.name ?? null,
			authorAvatar: avatar ? withHost(avatar) : DEFAULT_AUTHOR_AVATAR,
			authorRole: autor?.cargo ?? null,
			categories: (a.categorias?.data ?? []).map((c: any) => c.attributes?.name).filter(Boolean)
		};
	});

	return { products, pagination: res.meta?.pagination };
}
