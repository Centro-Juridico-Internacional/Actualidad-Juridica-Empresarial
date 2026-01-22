import type { APIRoute } from 'astro';
import { query, withHost } from '@/lib/strapi';
import { DEFAULT_NEWS_IMAGE } from '@/lib/api/_mediaDefaults';

/**
 * API de Sugerencias de Búsqueda
 *
 * ✔ Búsqueda inteligente en:
 *   - Título de la noticia
 *   - Nombre del autor
 *   - Cargo profesional
 *   - Nombre de la categoría
 * ✔ Consulta optimizada (Lite)
 * ✔ Diseñado para componentes de Autocompletado
 */
export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const q = url.searchParams.get('q')?.trim();

	if (!q || q.length < 3) {
		return new Response(JSON.stringify({ products: [] }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const clean = q
			.replace(/[^\w\s\u00C0-\u00FF]/g, ' ')
			.replace(/\s+/g, ' ')
			.toLowerCase();

		const filters =
			`filters[$or][0][titulo][$containsi]=${encodeURIComponent(clean)}` +
			`&filters[$or][1][autor][name][$containsi]=${encodeURIComponent(clean)}` +
			`&filters[$or][2][autor][cargo][$containsi]=${encodeURIComponent(clean)}` +
			`&filters[$or][3][categorias][name][$containsi]=${encodeURIComponent(clean)}`;

		const qs =
			`news?${filters}` +
			`&fields[0]=titulo` +
			`&fields[1]=slug` +
			`&populate[imagenes][fields][0]=url` +
			`&populate[autor][fields][0]=name` +
			`&pagination[limit]=5` +
			`&sort=updatedAt:desc`;

		const res = await query(qs);

		const products = (res.data ?? []).map((item: any) => {
			const a = item.attributes ?? item;

			const imgRel = a.imagenes?.data?.attributes?.url ?? a.imagenes?.url ?? null;

			return {
				title: a.titulo ?? '',
				slug: a.slug ?? '',
				image: imgRel ? withHost(imgRel) : DEFAULT_NEWS_IMAGE,
				authorName: a.autor?.data?.attributes?.name ?? a.autor?.name ?? null
			};
		});

		return new Response(JSON.stringify({ products }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error en API de sugerencias:', error);
		return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
