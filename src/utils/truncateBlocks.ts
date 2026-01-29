/**
 * Resultado de la operación de truncado
 */
interface TruncateResult {
	/** Texto truncado */
	text: string;
	/** Indica si se truncó el contenido */
	truncated: boolean;
}

/**
 * Trunca un texto a un número aproximado de palabras
 * @param content - Texto Markdown a truncar
 * @param maxWords - Número máximo de palabras permitidas
 * @returns Objeto con el texto truncado y un indicador de si se truncó
 */
export function truncateBlocks(content: any, maxWords: number): TruncateResult {
	// Si no hay contenido o no es un string (e.g. es un objeto bloque antiguo), devolvemos vacío o string
	if (!content) {
		return { text: '', truncated: false };
	}

	// Hotfix: Si llega un objeto (bloques JSON antiguos/corruptos), intentamos no explotar
	// Podríamos intentar extraer texto si es JSON, pero por ahora evitamos el crash.
	if (typeof content !== 'string') {
		console.warn('truncateBlocks recibió contenido no-string:', typeof content);
		return { text: '', truncated: false };
	}

	// 1. Remover etiquetas HTML: <tag>...</tag> (solo el tag, mantiene el contenido si es texto plano útil fuera de tags complejos)
	// Pero para oembed y figure, queremos borrar todo el bloque si es posible, o al menos el tag.
	// La solicitud es "solo y unicamente texto".
	// Primero removemos etiquetas HTML completas
	let cleanText = content.replace(/<[^>]*>/g, '');

	// 2. Remover imágenes Markdown: ![alt](url)
	cleanText = cleanText.replace(/!\[.*?\]\(.*?\)/g, '');

	// 2. Remover enlaces Markdown: [text](url) -> text
	cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

	// 3. Remover caracteres especiales de Markdown básicos (#, *, `, >, etc)
	// Esto es básico, si se requiere algo más robusto se podría instalar 'remove-markdown'
	cleanText = cleanText.replace(/[#*`_~>]/g, '');

	// 4. Limpiar espacios extra
	cleanText = cleanText.replace(/\s+/g, ' ').trim();

	const words = cleanText.split(/\s+/);

	if (words.length <= maxWords) {
		return { text: cleanText, truncated: false };
	}

	const truncatedText = words.slice(0, maxWords).join(' ') + '...';

	return { text: truncatedText, truncated: true };
}
