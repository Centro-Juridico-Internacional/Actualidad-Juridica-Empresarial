import { query } from './strapi';

const { STRAPI_HOST } = process.env;

export function getCategories() {
	return query(
		'categories?fields[0]=name&fields[1]=slug&fields[2]=description&populate[imagen][fields][0]=url'
	).then((res) => {
		return res.data.map((category: any) => {
			const { name, slug, description, imagen: rawImage } = category;
			const image = `${STRAPI_HOST}${rawImage.url}`;
			return {
				name,
				slug,
				description,
				image
			};
		});
	});
}
