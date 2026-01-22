import { query } from '../strapi';

export interface Interview {
	url: string | null;
	title: string | null;
}

/**
 * URLs de entrevistas en video.
 * Generalmente URLs de YouTube u otros proveedores de embed.
 * Orden: Más antiguas primero (ascendente) según updatedAt.
 */
export async function getInterviewsUrl(): Promise<Interview[]> {
	const res = await query(
		'entrevistas-urls?fields[0]=UrlEntrevista&fields[1]=Titulo&sort=updatedAt:asc'
	);

	return res.data.map((item: any) => {
		const a = item.attributes ?? item;
		return {
			url: a.UrlEntrevista ?? null,
			title: a.Titulo ?? null
		};
	});
}
