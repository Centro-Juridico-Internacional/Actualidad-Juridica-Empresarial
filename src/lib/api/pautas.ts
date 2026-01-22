// Integración con el Driver de Strapi y utilidades de Host
import { query, withHost } from '../strapi';

interface Pauta {
	title: string;
	image: string | null;
}

/**
 * Pautas Publicitarias.
 * Se obtienen del CMS y se cachean vía ISR en las páginas que las consumen (Home, etc.).
 */
export async function getPautas(): Promise<Pauta[]> {
	const res = await query('imagenes-pautas?fields[0]=Titulo&populate[Imagen][fields][0]=url');

	return res.data.map((item: any) => {
		const a = item.attributes ?? item;
		const imgRel = a.Imagen?.data?.attributes?.url ?? a.Imagen?.url ?? null;

		return {
			title: a.Titulo ?? a.titulo ?? '',
			image: imgRel ? withHost(imgRel) : null
		};
	});
}
