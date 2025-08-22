import { query } from './strapi';

const { STRAPI_HOST } = process.env;

export function getProducts({ categoryId }: { categoryId: string }) {
	return query(
		`products?filters[product_category][slug][$contains]=${categoryId}&populate=images`
	).then((res) => {
		const { data, meta } = res;
		console.log(data);
		const products = data.map((i: any) => {
			const { name, slug, description, images, price, stock } = i;
			const image = `${STRAPI_HOST}${images?.[0]?.url}`;
			return {
				name,
				slug,
				description,
				stock,
				price,
				image
			};
		});

		return { products, pagination: meta.pagination };
	});
}
