import { query, withHost } from '../strapi';

/**
 * Representa un autor de contenido
 */
interface Author {
	/** Nombre del autor */
	name: string;
	/** Rol del autor */
	role: string | null;
	/** URL del avatar del autor */
	avatar: string | null;
}

/**
 * Representa un item de autor retornado por Strapi
 */
interface StrapiAuthorItem {
	attributes?: {
		name?: string;
		role?: string;
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
	role?: string;
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
 * Obtiene la lista de autores desde Strapi
 * @returns Promesa con el array de autores
 * @throws Error si la consulta a la API falla
 */
export async function getAuthors(): Promise<Author[]> {
	try {
		const respuesta = (await query(
			'autors?populate[avatar][fields][0]=url&sort=createdAt:desc',
			{ revalidate: 3600 } // 1 hora - datos estáticos
		)) as { data: StrapiAuthorItem[] };

		return respuesta.data.map((item: StrapiAuthorItem) => {
			const atributos = item.attributes ?? item;
			const nombre = atributos.name ?? '';
			const rol = atributos.role ?? null;
			const avatarRelativo =
				atributos?.avatar?.data?.attributes?.url ?? atributos?.avatar?.url ?? null;

			return {
				name: nombre,
				role: rol,
				avatar: withHost(avatarRelativo)
			};
		});
	} catch (error) {
		console.error('Error al obtener los autores:', error);
		throw error;
	}
}
