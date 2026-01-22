/**
 * Extrae el ID de un video de YouTube a partir de una URL.
 * Soporta formatos estándar y acortados (youtu.be).
 */
export function getYoutubeVideoId(url: string): string | null {
	try {
		const parsedUrl = new URL(url);

		// Caso: https://www.youtube.com/watch?v=VIDEO_ID
		if (parsedUrl.hostname.includes('youtube.com')) {
			return parsedUrl.searchParams.get('v');
		}

		// Caso: https://youtu.be/VIDEO_ID
		if (parsedUrl.hostname === 'youtu.be') {
			return parsedUrl.pathname.replace('/', '');
		}

		return null;
	} catch (error) {
		// No es una URL válida
		return null;
	}
}
