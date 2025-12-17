import { query } from '../strapi';

export interface Interview {
	url: string | null;
	title: string | null;
}

/**
 * URLs de entrevistas (embeds, etc.).
 * Cache ISR en las páginas que las usen.
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
