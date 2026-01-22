import { query, withHost } from '../strapi';
import { DEFAULT_AUTHOR_AVATAR } from './_mediaDefaults';

/**
 * Modelo de Autor.
 * Incluye nombre, cargo profesional y avatar normalizado.
 */
interface Author {
	name: string;
	cargo: string | null;
	avatar: string | null;
}

/**
 * Obtiene la lista completa de autores.
 * Ordenados por fecha de creación descendente.
 */
export async function getAuthors(): Promise<Author[]> {
	const res = await query('authors?populate[avatar][fields][0]=url&sort=createdAt:desc');

	return res.data.map((item: any) => {
		const a = item.attributes ?? item;

		const avatarRel = a.avatar?.data?.attributes?.url ?? a.avatar?.url ?? null;

		return {
			name: a.name ?? '',
			cargo: a.cargo ?? null,
			avatar: avatarRel ? withHost(avatarRel) : DEFAULT_AUTHOR_AVATAR
		};
	});
}
