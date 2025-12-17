import { withHost } from './strapi';

/** Imágenes por defecto */
export const DEFAULT_NEWS_IMAGE = '/news-default.png';
export const DEFAULT_AUTHOR_AVATAR = '/avatar-default.png';
export const DEFAULT_CATEGORY_IMAGE = '/category-default.png';

/**
 * Normaliza una URL de media de Strapi.
 * Devuelve siempre una URL válida (o default).
 */
export function normalizeMediaUrl(
	relativeUrl?: string | null,
	defaultUrl?: string | null
): string | null {
	if (!relativeUrl) {
		return defaultUrl ?? null;
	}
	return withHost(relativeUrl);
}
