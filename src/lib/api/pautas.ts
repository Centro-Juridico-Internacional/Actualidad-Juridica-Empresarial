import { query, withHost } from '../strapi';

interface Pauta {
	title: string;
	image: string | null;
}

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
 * Pautas publicitarias.
 * Cacheadas a nivel de página (home, etc.) por ISR.
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
