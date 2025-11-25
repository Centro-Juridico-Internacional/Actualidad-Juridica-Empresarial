import { query } from '../strapi';

/**
 * Representa una entrevista
 */
interface Interview {
	/** URL de la entrevista */
	url: string | null;
	/** Título de la entrevista */
	title: string | null;
}

/**
 * Representa un item de entrevista retornado por Strapi
 */
interface StrapiInterviewItem {
	attributes?: {
		UrlEntrevista?: string;
		Titulo?: string;
	};
	UrlEntrevista?: string;
	Titulo?: string;
}

/**
 * Obtiene las URLs de las entrevistas desde Strapi
 * @returns Promesa con el array de entrevistas
 * @throws Error si la consulta a la API falla
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
