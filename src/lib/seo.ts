/**
 * SEO Helper para Open Graph, Twitter Cards y validación de metadatos
 * Especializado para Astro + Strapi news articles
 */

export interface SEOMetadata {
	title: string;
	description: string;
	image: string;
	imageWidth: number;
	imageHeight: number;
	url: string;
	publishedAt?: string;
	updatedAt?: string;
	authorName?: string;
	authorUrl?: string;
	siteName: string;
}

/**
 * Fallback de imagen si la noticia no tiene imagen
 * Debe ser URL ABSOLUTA accesible públicamente
 */
const DEFAULT_IMAGE = 'https://actualidadfrontend.vercel.app/header/logo.svg';
const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 630;

/**
 * Valida que una URL sea absoluta (no relativa)
 * @param url URL a validar
 * @returns true si es absoluta, false si es relativa
 */
export function isAbsoluteUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Asegura que una URL sea absoluta
 * @param url URL que puede ser relativa o absoluta
 * @param origin Origin del sitio (ej: https://actualidadfrontend.vercel.app)
 * @returns URL absoluta garantizada
 */
export function ensureAbsoluteUrl(url: string, origin: string): string {
	if (isAbsoluteUrl(url)) {
		return url;
	}
	// Si es relativa, prepend origin
	const cleanUrl = url.startsWith('/') ? url : `/${url}`;
	return `${origin}${cleanUrl}`;
}

/**
 * Genera un descripción SEO segura (max 160 caracteres para Google)
 * @param text Texto a truncar
 * @param maxLength Longitud máxima (default 160)
 * @returns Descripción truncada
 */
export function generateSEODescription(text: string, maxLength: number = 160): string {
	if (!text) return '';
	const trimmed = text.trim();
	if (trimmed.length <= maxLength) return trimmed;

	// Trunca y agrega elipsis, tratando de no cortar palabras
	let truncated = trimmed.substring(0, maxLength);
	const lastSpace = truncated.lastIndexOf(' ');
	if (lastSpace > maxLength - 20) {
		truncated = trimmed.substring(0, lastSpace);
	}
	return truncated.trim() + '...';
}

/**
 * Detecta dimensiones de imagen desde la URL (soporte básico para formatos comunes)
 * Para caso de uso con Strapi, retorna dimensiones estándar recomendadas
 * @param imageUrl URL de imagen
 * @returns Objeto con width y height
 */
export function detectImageDimensions(imageUrl: string): { width: number; height: number } {
	// Para imágenes desde Strapi, usar dimensiones estándar OG
	// Recomendación: 1200x630 (16:9 ratio ideal para redes sociales)
	return {
		width: 1200,
		height: 630
	};
}

/**
 * Procesa y valida metadatos de una noticia
 * @param metadata Metadatos parciales de entrada
 * @param origin URL origin (ej: https://actualidadfrontend.vercel.app)
 * @returns Metadatos completos y validados
 */
export function processSEOMetadata(
	metadata: Partial<SEOMetadata> & { title: string; url: string },
	origin: string
): SEOMetadata {
	const imageUrl = metadata.image ? ensureAbsoluteUrl(metadata.image, origin) : DEFAULT_IMAGE;

	const imageDimensions = detectImageDimensions(imageUrl);

	return {
		title: metadata.title,
		description: generateSEODescription(metadata.description || '', 160),
		image: imageUrl,
		imageWidth: metadata.imageWidth || imageDimensions.width,
		imageHeight: metadata.imageHeight || imageDimensions.height,
		url: metadata.url,
		publishedAt: metadata.publishedAt,
		updatedAt: metadata.updatedAt,
		authorName: metadata.authorName,
		authorUrl: metadata.authorUrl,
		siteName: metadata.siteName || 'Centro Jurídico Internacional'
	};
}

/**
 * Genera objeto de context para Schema.org NewsArticle (DEPRECATED)
 * ⚠️ Usar schemaOrg.ts en su lugar para mejores resultados
 * @deprecated Usar generateNewsArticleSchema de @/lib/schemaOrg
 */
export function generateNewsSchema(metadata: SEOMetadata, authorAvatarUrl?: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'NewsArticle',
		headline: metadata.title,
		description: metadata.description,
		image: [
			{
				'@type': 'ImageObject',
				url: metadata.image,
				width: metadata.imageWidth,
				height: metadata.imageHeight
			}
		],
		datePublished: metadata.publishedAt || new Date().toISOString(),
		dateModified: metadata.updatedAt || metadata.publishedAt || new Date().toISOString(),
		author: metadata.authorName
			? [
					{
						'@type': 'Person',
						name: metadata.authorName,
						...(metadata.authorUrl && { url: metadata.authorUrl }),
						...(authorAvatarUrl && {
							image: {
								'@type': 'ImageObject',
								url: authorAvatarUrl
							}
						})
					}
				]
			: [
					{
						'@type': 'Organization',
						name: 'Centro Jurídico Internacional'
					}
				],
		publisher: {
			'@type': 'Organization',
			name: metadata.siteName,
			logo: {
				'@type': 'ImageObject',
				url: `${metadata.url.split('/noticia')[0]}/header/logo.svg`
			}
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': metadata.url
		}
	};
}

/**
 * Valida que la imagen tenga al menos dimensiones mínimas recomendadas
 * @param width Ancho en pixeles
 * @param height Alto en pixeles
 * @returns true si cumple con mínimos (1200x630)
 */
export function validateImageDimensions(width: number, height: number): boolean {
	// Mínimo recomendado por Facebook, Twitter, LinkedIn
	return width >= 1200 && height >= 630;
}

/**
 * Tipo para el props de Layout.astro mejorado
 */
export interface LayoutSEOProps {
	title: string;
	booleanLayout: boolean;
	breadcrumbTitle?: string;
	description?: string;
	ogImage?: string;
	ogImageWidth?: number;
	ogImageHeight?: number;
	ogType?: 'website' | 'article';
	publishedAt?: string;
	updatedAt?: string;
	authorName?: string;
	authorUrl?: string;
}
