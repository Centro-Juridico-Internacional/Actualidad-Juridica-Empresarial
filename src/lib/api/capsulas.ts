import { query } from '../strapi';

export interface Capsula {
	url: string | null;
	title: string | null;
}

/**
 * URLs de Cápsulas Legales (Videos cortos informativos).
 * Se usan para carruseles de multimedia o secciones de interés.
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
