import { query } from './strapi';

export function getInterviewsUrl() {
	return query('entrevistas-urls?fields[0]=UrlEntrevista').then((res) => {
		return res.data.map((interview: any) => {
			const { UrlEntrevista } = interview;

			return {
				url: UrlEntrevista || null
			};
		});
	});
}
