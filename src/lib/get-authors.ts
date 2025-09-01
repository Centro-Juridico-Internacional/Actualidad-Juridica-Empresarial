import { query } from './strapi';

const { STRAPI_HOST } = process.env;

export function getAuthors() {
	return query('authors?fields[0]=name&populate[avatar][fields][0]=url').then((res) => {
		return res.data.map((author: any) => {
			const { name, avatar } = author;
			const avatarUrl = avatar?.url ? `${STRAPI_HOST}${avatar.url}` : null;

			return {
				name,
				avatar: avatarUrl
			};
		});
	});
}
