/**
 * Utilidades para SEO (Search Engine Optimization)
 * =========================================
 * Helpers para validar, procesar y generar metadatos compatibles con
 * Open Graph, Twitter Cards y estándares de Google.
 *
 * Especializado para arquitecturas Astro + Strapi (Headless CMS).
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
 * Imagen de respaldo (Default)
 * Se usa cuando una noticia o página no tiene imagen destacada.
 * Requisito: Debe ser una URL ABSOLUTA y pública.
 */
const DEFAULT_IMAGE = 'https://actualidadfrontend.vercel.app/header/logo.svg';
const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 630;

/**
 * Valida si una cadena de texto es una URL absoluta.
 * @param url Cadena a evaluar.
 * @returns true si comienza con protocolo http/https, false si es relativa.
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
 * Garantiza que una URL sea absoluta agregando el origen si es necesario.
 * Vital para metadatos Open Graph que exigen URLs completas.
 *
 * @param url URL relativa o absoluta.
 * @param origin Dominio base (ej: https://misitio.com).
 */
export function ensureAbsoluteUrl(url: string, origin: string): string {
	if (isAbsoluteUrl(url)) {
		return url;
	}
	// Normalización de slash inicial para rutas relativas
	const cleanUrl = url.startsWith('/') ? url : `/${url}`;
	return `${origin}${cleanUrl}`;
}

/**
 * Genera una descripción optimizada para SEO.
 * Trunca el texto respetando límites de caracteres de motores de búsqueda.
 *
 * @param text Texto fuente.
 * @param maxLength Límite seguro (Default: 160 chars para Google SERP).
 */
export function generateSEODescription(text: string, maxLength: number = 160): string {
	if (!text) return '';
	const trimmed = text.trim();
	if (trimmed.length <= maxLength) return trimmed;

	// Truncado inteligente: intenta no cortar palabras a la mitad
	let truncated = trimmed.substring(0, maxLength);
	const lastSpace = truncated.lastIndexOf(' ');
	if (lastSpace > maxLength - 20) {
		truncated = trimmed.substring(0, lastSpace);
	}
	return truncated.trim() + '...';
}

/**
 * Infiere dimensiones de imagen cuando no son provistas por el CMS.
 * Retorna el estándar recomendado para redes sociales (1200x630).
 *
 * @param imageUrl URL de la imagen (referencia).
 */
export function detectImageDimensions(imageUrl: string): { width: number; height: number } {
	// Estrategia: Asumir aspect ratio 1.91:1 (Estándar OG Image)
	return {
		width: 1200,
		height: 630
	};
}

/**
 * Procesa y sanea un objeto parcial de metadatos.
 * Rellena valores faltantes con defaults seguros.
 *
 * @param metadata Datos crudos desde el CMS/Componente.
 * @param origin Origen para resolución de URLs.
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
		siteName: metadata.siteName || 'Actualidad Jurídica Empresarial'
	};
}

/**
 * Generador Legacy de NewsArticle Schema.
 * @deprecated Usar implementación robusta en `lib/schemaOrg.ts`.
 * Mantenido por compatibilidad regresiva temporal.
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
						name: 'Actualidad Jurídica Empresarial'
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
 * Valida cumplemiento de requisitos mínimos de tamaño de imagen.
 * Importante para asegurar que la imagen aparezca grande en Twitter/Facebook.
 */
export function validateImageDimensions(width: number, height: number): boolean {
	// 1200x630 es el estándar ideal para compartir en redes
	return width >= 1200 && height >= 630;
}

/**
 * Props extendidas para el Layout Principal
 * Define el contrato de datos necesarios para renderizar head tags correctamente.
 */
export interface LayoutSEOProps {
	title: string;
	booleanLayout: boolean; // Controla modo inmersivo vs estándar
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
