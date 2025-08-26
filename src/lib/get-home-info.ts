import { query } from './strapi';

const { STRAPI_HOST } = process.env;

export function getHomeInfo() {
	return query('home?populate=image').then((res) => {
		const { title, description, image } = res.data;
		const images = `${STRAPI_HOST}${image.url}`;
		return { title, description, images };
	});
}
