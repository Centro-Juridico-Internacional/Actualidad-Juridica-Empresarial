import { query, withHost } from '../strapi';

interface Pdf {
	titulo: string;
	slug: string;
	pdf: string | null;
}

/**
 * Revistas PDF.
 * Soporta una o múltiples revistas.
 * Cacheado por ISR en la página que lo use.
 */
export async function getPdfs(): Promise<Pdf[]> {
	const res = await query('revista-pdfs?populate[Revista][fields][0]=url');

	const items = res?.data ?? [];

	return items.map((item: any) => {
		const pdfUrl = item?.Revista?.url ?? null;

		return {
			titulo: item?.Titulo ?? '',
			slug: item?.Slug ?? '',
			pdf: pdfUrl ? withHost(pdfUrl) : null
		};
	});
}
