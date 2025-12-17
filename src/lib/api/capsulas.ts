import { query } from '../strapi';

export interface Capsula {
	url: string | null;
	title: string | null;
}

/**
 * URLs de Capsulas Legales (embeds, etc.).
 * Cache ISR en las páginas que las usen.
 */
export async function getCapsulasUrl(): Promise<Capsula[]> {
	const res = await query(
		'capsulas-legales-urls?fields[0]=UrlCapsulaLegal&fields[1]=Titulo&sort=updatedAt:asc'
	);

	return res.data.map((item: any) => {
		const a = item.attributes ?? item;
		return {
			url: a.UrlCapsulaLegal ?? null,
			title: a.Titulo ?? null
		};
	});
}
