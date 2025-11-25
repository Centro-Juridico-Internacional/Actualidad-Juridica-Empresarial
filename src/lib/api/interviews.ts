import { query } from '../strapi';

export async function getInterviewsUrl() {
	const res = await query(
		'entrevistas-urls?fields[0]=UrlEntrevista&fields[1]=Titulo&sort=updatedAt:asc'
	);
	return res.data.map((item: any) => {
		const a = item.attributes ?? item;
		return {
			url: a?.UrlEntrevista ?? null,
			title: a?.Titulo ?? null
		};
	});
}
