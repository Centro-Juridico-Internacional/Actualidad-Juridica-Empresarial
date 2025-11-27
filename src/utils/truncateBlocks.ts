import type { BlocksContent } from '@strapi/blocks-react-renderer';

/**
 * Resultado de la operación de truncado
 */
interface TruncateResult {
	/** Bloques truncados */
	blocks: BlocksContent;
	/** Indica si se truncó el contenido */
	truncated: boolean;
}

/**
 * Trunca un array de bloques de texto a un número máximo de palabras
 * @param blocks - Array de bloques a truncar
 * @param maxWords - Número máximo de palabras permitidas
 * @returns Objeto con los bloques truncados y un indicador de si se truncó
 */
export function truncateBlocks(blocks: BlocksContent, maxWords: number): TruncateResult {
	let contadorPalabras = 0;
	// @ts-ignore - We know BlocksContent is an array
	const bloquesTruncados: any[] = [];
	let seTrunco = false;

	// @ts-ignore - We know BlocksContent is iterable
	for (const bloque of blocks) {
		if (bloque.type === 'paragraph' && bloque.children && Array.isArray(bloque.children)) {
			const hijosNuevos: any[] = [];
			for (const hijo of bloque.children) {
				const palabras = ((hijo as any).text || '').split(/\s+/).filter(Boolean);
				if (contadorPalabras + palabras.length <= maxWords) {
					hijosNuevos.push(hijo);
					contadorPalabras += palabras.length;
				} else {
					const palabrasRestantes = maxWords - contadorPalabras;
					if (palabrasRestantes > 0) {
						let textoTruncado = palabras.slice(0, palabrasRestantes).join(' ');
						textoTruncado = textoTruncado.replace(/[.,;!?]*$/, '') + '...';
						hijosNuevos.push({ ...hijo, text: textoTruncado });
						contadorPalabras += palabrasRestantes;
					}
					seTrunco = true;
					break;
				}
			}
			if (hijosNuevos.length > 0) {
				bloquesTruncados.push({ ...bloque, children: hijosNuevos });
			}
			if (seTrunco) break;
		} else {
			bloquesTruncados.push(bloque);
		}
	}

	return { blocks: bloquesTruncados, truncated: seTrunco };
}
