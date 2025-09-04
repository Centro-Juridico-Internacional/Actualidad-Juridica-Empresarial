import { query } from './strapi';

const { STRAPI_HOST } = process.env;

export function getBanner() {
	return query('banner?populate=imagen').then((res) => {
		const { nombre, slug, imagen } = res.data;
		const banner = `${STRAPI_HOST}${imagen.url}`;
		return { nombre, slug, banner };
	});
}
