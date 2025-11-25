/**
 * Representa un elemento hijo de un bloque de texto
 */
interface BlockChild {
	/** Texto del elemento */
	text?: string;
	/** Propiedades adicionales del elemento */
	[key: string]: unknown;
}

/**
 * Representa un bloque de contenido
 */
interface Block {
	/** Tipo de bloque (ej: 'paragraph', 'heading', etc.) */
	type: string;
	/** Elementos hijos del bloque */
	children?: BlockChild[];
	/** Propiedades adicionales del bloque */
	[key: string]: unknown;
}

/**
 * Resultado de la operación de truncado
 */
interface TruncateResult {
	/** Bloques truncados */
	blocks: Block[];
	/** Indica si se truncó el contenido */
	truncated: boolean;
}

/**
 * Trunca un array de bloques de texto a un número máximo de palabras
 * @param blocks - Array de bloques a truncar
 * @param maxWords - Número máximo de palabras permitidas
 * @returns Objeto con los bloques truncados y un indicador de si se truncó
 */
export function truncateBlocks(blocks: Block[], maxWords: number): TruncateResult {
	let contadorPalabras = 0;
	const bloquesTruncados: Block[] = [];
	let seTrunco = false;

	for (const bloque of blocks) {
		if (bloque.type === 'paragraph' && bloque.children && Array.isArray(bloque.children)) {
			const hijosNuevos: BlockChild[] = [];
			for (const hijo of bloque.children) {
				const palabras = (hijo.text || '').split(/\s+/).filter(Boolean);
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
