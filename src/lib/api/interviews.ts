import { query } from '../strapi';

export interface Interview {
	url: string | null;
	title: string | null;
}

interface StrapiInterviewItem {
	attributes?: {
		UrlEntrevista?: string;
		Titulo?: string;
	};
	UrlEntrevista?: string;
	Titulo?: string;
}

/**
 * URLs de entrevistas (embeds, etc.).
 * Cache ISR en las páginas que las usen.
 */
export async function getInterviewsUrl(): Promise<Interview[]> {
	try {
		const respuesta = (await query(
			'entrevistas-urls?fields[0]=UrlEntrevista&fields[1]=Titulo&sort=updatedAt:asc'
		)) as { data: StrapiInterviewItem[] };

		return respuesta.data.map((item: StrapiInterviewItem) => {
			const atributos = item.attributes ?? item;
			return {
				url: atributos?.UrlEntrevista ?? null,
				title: atributos?.Titulo ?? null
			};
		});
	} catch (error) {
		console.error('Error al obtener las entrevistas:', error);
		throw error;
	}
}
