import { query, withHost } from '../strapi';
import { DEFAULT_CATEGORY_IMAGE } from './_mediaDefaults';

interface Magazine {
	id: string;
	title: string;
	slug: string;
	pdf: string | null;
	cover: string | null;
}

/**
 * Obtiene una revista específica por Slug.
 * Recupera tanto el archivo PDF como la imagen de portada.
 */
export async function getMagazineBySlug(slug: string): Promise<Magazine | null> {
	const res = await query(
		`revista-pdfs?filters[Slug][$eq]=${slug}&populate[Revista][fields][0]=url&populate[Portada][fields][0]=url`
	);

	const item = res?.data?.[0];
	if (!item) return null;

	const a = item.attributes ?? item;
	const pdfUrl = a?.Revista?.data?.attributes?.url ?? a?.Revista?.url ?? null;
	const coverUrl = a?.Portada?.data?.attributes?.url ?? a?.Portada?.url ?? null;

	// Imagen de fallback si no hay portada
	const finalCover = coverUrl ? withHost(coverUrl) : DEFAULT_CATEGORY_IMAGE;

	return {
		id: String(item.id ?? ''),
		title: a?.Titulo ?? '',
		slug: a?.Slug ?? '',
		pdf: pdfUrl ? withHost(pdfUrl) : null,
		cover: finalCover
	};
}

/**
 * Obtiene listado de todas las revistas (PDFs).
 * Ordenadas por fecha de publicación descendente.
 * Usado para el listado principal de ediciones anteriores.
 */
export async function getMagazines(): Promise<Magazine[]> {
	const res = await query(
		'revista-pdfs?populate[Revista][fields][0]=url&populate[Portada][fields][0]=url&sort[0]=publishedAt:desc'
	);

	const items = res?.data ?? [];

	return items.map((item: any) => {
		const a = item.attributes ?? item;
		const pdfUrl = a?.Revista?.data?.attributes?.url ?? a?.Revista?.url ?? null;
		const coverUrl = a?.Portada?.data?.attributes?.url ?? a?.Portada?.url ?? null;

		const finalCover = coverUrl ? withHost(coverUrl) : DEFAULT_CATEGORY_IMAGE;

		return {
			id: String(item.id ?? ''),
			title: a?.Titulo ?? '',
			slug: a?.Slug ?? '',
			pdf: pdfUrl ? withHost(pdfUrl) : null,
			cover: finalCover
		};
	});
}

export { getMagazineBySlug as getRevistaBySlug, getMagazines as getPdfs };
