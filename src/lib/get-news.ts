import { query, withHost } from './strapi';

export async function getNews({ categoryId }: { categoryId: string }) {
	const qs =
		`news?` +
		`filters[categorias][slug][$contains]=${encodeURIComponent(categoryId ?? '')}` +
		`&populate[imagenes][fields][0]=url` +
		`&populate[autor][populate][avatar][fields][0]=url` +
		`&populate[autor][fields][0]=name` +
		`&populate[categorias][fields][0]=name` +
		`&sort=updatedAt:desc`;

	const res = await query(qs);

	const products = res.data.map((item: any) => {
		const a = item.attributes ?? item;

		const imgRel = a?.imagenes?.data?.attributes?.url ?? a?.imagenes?.url ?? null;

		const autor = a?.autor?.data?.attributes ?? a?.autor ?? {};
		const autorAvatarRel = autor?.avatar?.data?.attributes?.url ?? autor?.avatar?.url ?? null;

		const categorias = (a?.categorias?.data ?? a?.categorias ?? [])
			.map((c: any) => c.attributes?.name ?? c?.name)
			.filter(Boolean);

		const published = a?.publishedAt ?? a?.updatedAt ?? a?.createdAt;
		const d = published ? new Date(published) : new Date();

		return {
			titulo: a?.titulo,
			contenido: a?.contenido,
			slug: a?.slug,
			image: withHost(imgRel),
			dia: d.toLocaleDateString(),
			hora: d.toLocaleTimeString(),
			UrlYoutube: a?.UrlYoutube ?? null,
			autorName: autor?.name ?? null,
			autorAvatar: withHost(autorAvatarRel),
			categorias
		};
	});

	return { products, pagination: res?.meta?.pagination };
}
