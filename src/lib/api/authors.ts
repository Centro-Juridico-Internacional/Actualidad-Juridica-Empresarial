// src/lib/get-authors.ts
import { query, withHost } from '../strapi';

export async function getAuthors() {
	// Strapi v4/v5: /api/authors?fields[0]=name&fields[1]=role&populate[avatar][fields][0]=url
	const res = await query('authors?fields[0]=name&fields[1]=role&populate[avatar][fields][0]=url');

	return res.data.map((item: any) => {
		const a = item.attributes ?? item; // v4/v5 compat
		const name = a.name;
		const role = a.role ?? null;
		const avatarRel = a?.avatar?.data?.attributes?.url ?? a?.avatar?.url ?? null;
		return {
			name,
			role,
			avatar: withHost(avatarRel)
		};
	});
}
