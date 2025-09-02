import { query } from './strapi';

export function getInterviewsUrl() {
	return query('entrevistas-urls?fields[0]=UrlEntrevista&fields[1]=Titulo').then((res) => {
		return res.data.map((interview: any) => {
			const { UrlEntrevista, Titulo } = interview;

			return {
				url: UrlEntrevista || null,
				title: Titulo || null
			};
		});
	});
}
