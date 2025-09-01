import { query } from './strapi';

const { STRAPI_HOST } = process.env;

export function getPautas() {
	return query('imagenes-pautas?fields[0]=Titulo&populate[Imagen][fields][0]=url').then((res) => {
		return res.data.map((pauta: any) => {
			const { Titulo, Imagen } = pauta;
			const imageUrl = Imagen?.url ? `${STRAPI_HOST}${Imagen.url}` : null;

			return {
				title: Titulo,
				image: imageUrl
			};
		});
	});
}
