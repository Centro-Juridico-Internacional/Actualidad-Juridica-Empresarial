import { query } from './strapi';

const { STRAPI_HOST } = process.env;

export function getNews({ categoryId }: { categoryId: string }) {
	return query(
		`news?filters[categorias][slug][$contains]=${categoryId}&populate[imagenes][fields][0]=url&populate[autor][populate][avatar][fields][0]=url&populate[autor][fields][1]=name&populate[categorias][fields][2]=name&sort=createdAt:desc`
	).then((res) => {
		const { data, meta } = res;
		const products = data.map((i: any) => {
			const {
				titulo,
				contenido,
				slug,
				imagenes,
				publishedAt,
				UrlYoutube,
				autor: dataAutor,
				categorias: dataCategorias
			} = i;
			const image = `${STRAPI_HOST}${imagenes?.url}`;
			const autorName = dataAutor?.name;
			const autorAvatar = `${STRAPI_HOST}${dataAutor?.avatar?.url}`;
			const dia = new Date(publishedAt).toLocaleDateString();
			const hora = new Date(publishedAt).toLocaleTimeString();
			const categorias = dataCategorias?.map((i: any) => i.name) || [];

			return {
				titulo,
				contenido,
				slug,
				image,
				dia,
				hora,
				UrlYoutube,
				autorName,
				autorAvatar,
				categorias
			};
		});

		return { products, pagination: meta.pagination };
	});
}
