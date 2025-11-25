import { query, withHost } from '../strapi';

/**
 * Representa una pauta publicitaria
 */
interface Pauta {
	/** Título de la pauta */
	title: string;
	/** URL de la imagen de la pauta */
	image: string | null;
}

/**
 * Representa un item de pauta retornado por Strapi
 */
interface StrapiPautaItem {
	attributes?: {
		Titulo?: string;
		titulo?: string;
		Imagen?: {
			data?: {
				attributes?: {
					url?: string;
				};
			};
			url?: string;
		};
	};
	Titulo?: string;
	titulo?: string;
	Imagen?: {
		data?: {
			attributes?: {
				url?: string;
			};
		};
		url?: string;
	};
}

/**
 * Obtiene la lista de pautas publicitarias desde Strapi
 * @returns Promesa con el array de pautas
 * @throws Error si la consulta a la API falla
 */
export async function getPautas(): Promise<Pauta[]> {
	try {
		const respuesta = (await query(
			'imagenes-pautas?fields[0]=Titulo&populate[Imagen][fields][0]=url'
		)) as { data: StrapiPautaItem[] };

		return respuesta.data.map((item: StrapiPautaItem) => {
			const atributos = item.attributes ?? item;
			const titulo = atributos?.Titulo ?? atributos?.titulo ?? '';
			const imagenRelativa =
				atributos?.Imagen?.data?.attributes?.url ?? atributos?.Imagen?.url ?? null;

			return {
				title: titulo,
				image: withHost(imagenRelativa)
			};
		});
	} catch (error) {
		console.error('Error al obtener las pautas:', error);
		throw error;
	}
}
