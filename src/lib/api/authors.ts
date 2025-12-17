import { query, withHost } from '../strapi';

/**
 * Representa un autor de contenido
 */
interface Author {
	name: string;
	cargo: string | null;
	avatar: string | null;
}

interface StrapiAuthorItem {
	attributes?: {
		name?: string;
		cargo?: string;
		avatar?: {
			data?: {
				attributes?: {
					url?: string;
				};
			};
			url?: string;
		};
	};
	name?: string;
	cargo?: string;
	avatar?: {
		data?: {
			attributes?: {
				url?: string;
			};
		};
		url?: string;
	};
}

/**
 * Obtiene la lista de autores desde Strapi.
 * Los datos se cachean en Vercel ISR a nivel de página, no aquí.
 */
export async function getAuthors(): Promise<Author[]> {
	try {
		const respuesta = (await query(
			'authors?populate[avatar][fields][0]=url&sort=createdAt:desc'
		)) as { data: StrapiAuthorItem[] };

		const DEFAULT_AVATAR = '/avatar-default.png';

		return respuesta.data.map((item: StrapiAuthorItem) => {
			const atributos = item.attributes ?? item;
			const nombre = atributos.name ?? '';
			const cargoAutor = atributos.cargo ?? null;
			const avatarRelativo =
				atributos?.avatar?.data?.attributes?.url ?? atributos?.avatar?.url ?? null;

			const avatarFinal = avatarRelativo ? withHost(avatarRelativo) : DEFAULT_AVATAR;

			return {
				name: nombre,
				cargo: cargoAutor,
				avatar: avatarFinal
			};
		});
	} catch (error) {
		console.error('Error al obtener los autores:', error);
		throw error;
	}
}
