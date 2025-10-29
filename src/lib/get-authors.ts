import { query, withHost } from './strapi';

export async function getAuthors() {
	const res = await query('authors?fields[0]=name&populate[avatar][fields][0]=url');
	// Strapi v4/v5: res.data = [{ id, attributes: { name, avatar: { data: { attributes: { url }}}}}]
	return res.data.map((item: any) => {
		const a = item.attributes ?? item; // fallback por si viene aplanado
		const name = a.name;
		const avatarRel = a?.avatar?.data?.attributes?.url ?? a?.avatar?.url ?? null;

		return {
			name,
			avatar: withHost(avatarRel)
		};
	});
}
