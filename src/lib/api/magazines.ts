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
 * Get a specific magazine by slug.
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

	// Use default image if no cover
	const finalCover = coverUrl ? withHost(coverUrl) : DEFAULT_CATEGORY_IMAGE;

	return {
		id: String(item.id ?? ''),
		title: a?.Titulo ?? '',
		slug: a?.Slug ?? '',
		pdf: pdfUrl ? withHost(pdfUrl) : null,
		cover: finalCover
	};
}

interface MagazinePdf {
	id: string;
	title: string;
	slug: string;
	pdf: string | null;
	cover: string | null;
}

/**
 * Get all magazine PDFs.
 * Supports one or multiple magazines.
 * Cached by ISR on the page that uses it.
 * Sorted by publication date (most recent first).
 */
export async function getMagazines(): Promise<MagazinePdf[]> {
	const res = await query(
		'revista-pdfs?populate[Revista][fields][0]=url&populate[Portada][fields][0]=url&sort[0]=publishedAt:desc'
	);

	const items = res?.data ?? [];

	return items.map((item: any) => {
		const a = item.attributes ?? item;
		const pdfUrl = a?.Revista?.data?.attributes?.url ?? a?.Revista?.url ?? null;
		const coverUrl = a?.Portada?.data?.attributes?.url ?? a?.Portada?.url ?? null;

		// Use default image if no cover
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

// Legacy export for backward compatibility
export { getMagazineBySlug as getRevistaBySlug, getMagazines as getPdfs };
