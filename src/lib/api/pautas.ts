import { query, withHost } from '../strapi';

export async function getPautas() {
	const res = await query('imagenes-pautas?fields[0]=Titulo&populate[Imagen][fields][0]=url');
	return res.data.map((item: any) => {
		const a = item.attributes ?? item;
		const title = a?.Titulo ?? a?.titulo ?? '';
		const imgRel = a?.Imagen?.data?.attributes?.url ?? a?.Imagen?.url ?? null;

		return {
			title,
			image: withHost(imgRel)
		};
	});
}
