/**
 * Utilidades para la generación de JSON-LD (Schema.org)
 * Especializado para noticias jurídicas con Astro + Strapi
 *
 * Implementa:
 * - NewsArticle (Artículos de noticias)
 * - Organization (Datos de la organización)
 * - WebSite (Metadata del sitio)
 * - BreadcrumbList (Navegación estructurada)
 * - FAQPage (Opcional, para preguntas frecuentes)
 */

/**
 * ============================================
 * TIPOS AUXILIARES
 * ============================================
 */

export interface SchemaImage {
	url: string;
	width?: number;
	height?: number;
}

export interface SchemaPerson {
	name: string;
	url?: string;
	image?: SchemaImage;
	description?: string;
	email?: string;
}

export interface SchemaOrganization {
	name: string;
	logo: SchemaImage;
	url: string;
	sameAs?: string[]; // URLs de redes sociales
	email?: string;
	description?: string;
	contactPoint?: {
		type: string;
		telephone?: string;
		email?: string;
	};
}

export interface SchemaNewsArticle {
	headline: string;
	description: string;
	image: SchemaImage | SchemaImage[];
	datePublished: string;
	dateModified: string;
	author: SchemaPerson | SchemaPerson[];
	publisher: SchemaOrganization;
	mainEntityOfPage: string;
	wordCount?: number;
	articleBody?: string;
	keywords?: string[];
}

export interface SchemaBreadcrumb {
	url: string;
	name: string;
}

/**
 * ============================================
 * NORMALIZACIÓN Y VALIDACIÓN
 * ============================================
 */

/**
 * Normaliza fecha ISO a formato RFC3339 (requerido por Schema.org)
 */
export function normalizeDate(date: string | Date): string {
	if (!date) return new Date().toISOString();

	const d = new Date(date);
	if (isNaN(d.getTime())) {
		return new Date().toISOString();
	}

	return d.toISOString();
}

/**
 * Asegura que URL sea absoluta (requerido para Schema.org)
 */
export function ensureAbsoluteUrl(url: string, origin: string): string {
	if (!url) return origin;

	try {
		// Si ya es URL absoluta, devolver como está
		return new URL(url).href;
	} catch {
		// Si es relativa, agregar origin
		return new URL(url, origin).href;
	}
}

/**
 * Valida que imagen tenga dimensiones mínimas recomendadas
 */
export function validateImageDimensions(width?: number, height?: number): boolean {
	// Mínimo recomendado: 1200x630 para redes sociales
	return Boolean(width && height && width >= 1200 && height >= 630);
}

/**
 * Normaliza imagen para Schema.org (asegura URL absoluta)
 */
export function normalizeImage(
	image: string | SchemaImage | null | undefined,
	origin: string
): SchemaImage {
	if (!image) {
		return {
			url: `${origin}/header/logo.svg`,
			width: 1200,
			height: 630
		};
	}

	if (typeof image === 'string') {
		return {
			url: ensureAbsoluteUrl(image, origin),
			width: 1200,
			height: 630
		};
	}

	return {
		...image,
		url: ensureAbsoluteUrl(image.url, origin)
	};
}

/**
 * Limpia y normaliza texto para Schema.org
 */
export function normalizeText(text: string | null | undefined): string {
	if (!text) return '';

	return text
		.trim()
		.replace(/\n+/g, ' ') // Reemplaza saltos de línea con espacios
		.replace(/\s+/g, ' ') // Normaliza espacios múltiples
		.slice(0, 5000); // Límite de caracteres
}

/**
 * ============================================
 * GENERADORES DE SCHEMA.ORG
 * ============================================
 */

/**
 * Genera schema NewsArticle completo
 * PARÁMETROS REQUERIDOS EN STRAPI:
 * - titulo: string (headline)
 * - contenido: blocks (articleBody)
 * - imagenes: media (image)
 * - publishedAt: date (datePublished)
 * - updatedAt: date (dateModified)
 * - autor: relation to Author (author)
 *
 * RECOMENDADO:
 * - metaDescription: string (description)
 * - metaKeywords: string (keywords, comma-separated)
 * - canonicalUrl: string (mainEntityOfPage)
 */
export function generateNewsArticleSchema(
	data: {
		headline: string;
		description: string;
		image: string | SchemaImage;
		datePublished: string;
		dateModified: string;
		author?: SchemaPerson | SchemaPerson[];
		publisher: SchemaOrganization;
		mainEntityOfPage: string;
		articleBody?: string;
		keywords?: string[];
		wordCount?: number;
	},
	origin: string
): any {
	const normalizedImage = normalizeImage(
		typeof data.image === 'string' ? data.image : data.image,
		origin
	);

	return {
		'@context': 'https://schema.org',
		'@type': 'NewsArticle',

		// OBLIGATORIOS
		headline: normalizeText(data.headline).slice(0, 110),
		description: normalizeText(data.description).slice(0, 160),
		image: [normalizedImage],
		datePublished: normalizeDate(data.datePublished),
		dateModified: normalizeDate(data.dateModified),

		// AUTOR
		author: data.author || {
			'@type': 'Organization',
			name: data.publisher.name
		},

		// PUBLICADOR
		publisher: {
			'@type': 'Organization',
			name: data.publisher.name,
			logo: normalizeImage(data.publisher.logo, origin)
		},

		// PÁGINA PRINCIPAL
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': ensureAbsoluteUrl(data.mainEntityOfPage, origin)
		},

		// OPCIONAL PERO RECOMENDADO
		...(data.articleBody && {
			articleBody: normalizeText(data.articleBody).slice(0, 10000)
		}),

		...(data.keywords &&
			data.keywords.length > 0 && {
				keywords: data.keywords.slice(0, 10).join(', ')
			}),

		...(data.wordCount && {
			wordCount: Math.max(100, Math.min(data.wordCount, 50000))
		})
	};
}

/**
 * Genera schema Organization (identidad del sitio)
 */
export function generateOrganizationSchema(organization: SchemaOrganization, origin: string): any {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: organization.name,
		url: organization.url || origin,
		logo: normalizeImage(organization.logo, origin),
		...(organization.description && {
			description: normalizeText(organization.description)
		}),
		...(organization.sameAs &&
			organization.sameAs.length > 0 && {
				sameAs: organization.sameAs.map((url) => ensureAbsoluteUrl(url, origin))
			}),
		...(organization.contactPoint && {
			contactPoint: {
				'@type': 'ContactPoint',
				...organization.contactPoint
			}
		})
	};
}

/**
 * Genera schema WebSite (metadatos del sitio entero)
 */
export function generateWebSiteSchema(
	data: {
		name: string;
		description: string;
		url: string;
		logo: SchemaImage;
		siteLanguage: string; // e.g., "es-CO"
	},
	origin: string
): any {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: data.name,
		description: normalizeText(data.description),
		url: data.url || origin,
		logo: normalizeImage(data.logo, origin),
		inLanguage: data.siteLanguage,
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${origin}/buscar?q={search_term_string}`
			},
			'query-input': 'required name=search_term_string'
		}
	};
}

/**
 * Genera schema BreadcrumbList (navegación estructurada)
 */
export function generateBreadcrumbSchema(breadcrumbs: SchemaBreadcrumb[], origin: string): any {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: breadcrumbs.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.name,
			item: ensureAbsoluteUrl(crumb.url, origin)
		}))
	};
}

/**
 * Genera esquema para Video (si hay URL de YouTube)
 */
export function generateVideoSchema(
	data: {
		name: string;
		description: string;
		youtubeUrl: string;
		publishedAt: string;
		thumbnailUrl?: string;
	},
	origin: string
): any {
	// Extrae video ID de URL de YouTube
	const getYoutubeId = (url: string): string | null => {
		const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^&\n?#]+)/;
		const match = url.match(regex);
		return match?.[1] || null;
	};

	const videoId = getYoutubeId(data.youtubeUrl);
	if (!videoId) return null;

	return {
		'@context': 'https://schema.org',
		'@type': 'VideoObject',
		name: data.name,
		description: normalizeText(data.description),
		videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
		embedUrl: `https://www.youtube.com/embed/${videoId}`,
		thumbnailUrl: data.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
		uploadDate: normalizeDate(data.publishedAt),
		duration: 'PT0M0S' // Será reemplazado si hay datos reales
	};
}

/**
 * Genera esquema agregado (múltiples esquemas en uno)
 * Útil para evitar múltiples etiquetas <script type="application/ld+json">
 */
export function generateAggregateSchema(schemas: any[], origin: string): any {
	return {
		'@context': 'https://schema.org',
		'@graph': schemas.filter(Boolean)
	};
}

/**
 * ============================================
 * HELPER PARA INSERCIÓN EN ASTRO
 * ============================================
 */

/**
 * Convierte un objeto schema a string JSON-LD seguro para HTML
 */
export function schemaToJsonLd(schema: any): string {
	return JSON.stringify(schema, null, 2)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026');
}

/**
 * Crea un componente Astro con el JSON-LD inyectado
 * USO EN ASTRO:
 * ```astro
 * import { getSchemaScript } from '@/lib/schemaOrg';
 * const schema = generateNewsArticleSchema(...);
 * const scriptTag = getSchemaScript(schema);
 * ```
 * Luego en el HTML: `{scriptTag && <Fragment set:html={scriptTag} />}`
 */
export function getSchemaScript(schema: any): string {
	const jsonLd = schemaToJsonLd(schema);
	return `<script type="application/ld+json">${jsonLd}<\/script>`;
}

/**
 * ============================================
 * VALIDACIÓN PARA GOOGLE RICH RESULTS
 * ============================================
 */

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Valida que un NewsArticle schema cumpla con requisitos de Google
 * https://developers.google.com/search/docs/appearance/structured-data/article
 */
export function validateNewsArticleSchema(schema: any): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// REQUERIDOS
	if (!schema['@type'] || schema['@type'] !== 'NewsArticle') {
		errors.push('El esquema debe tener @type: "NewsArticle"');
	}

	if (!schema.headline) {
		errors.push('headline es obligatorio');
	} else if (schema.headline.length > 110) {
		warnings.push(`headline debe tener máximo 110 caracteres (tiene ${schema.headline.length})`);
	}

	if (!schema.image || !Array.isArray(schema.image) || schema.image.length === 0) {
		errors.push('image es obligatorio (debe ser array)');
	} else {
		const img = schema.image[0];
		if (!img.url) errors.push('image[0].url es obligatorio');
		if (!img.width || img.width < 696) warnings.push('image width debe ser >= 696px');
		if (!img.height || img.height < 696) warnings.push('image height debe ser >= 696px');
	}

	if (!schema.datePublished) {
		errors.push('datePublished es obligatorio');
	} else if (!isValidRFC3339(schema.datePublished)) {
		errors.push('datePublished debe estar en formato RFC3339/ISO8601');
	}

	if (!schema.dateModified) {
		errors.push('dateModified es obligatorio');
	} else if (!isValidRFC3339(schema.dateModified)) {
		errors.push('dateModified debe estar en formato RFC3339/ISO8601');
	}

	if (!schema.author) {
		errors.push('author es obligatorio');
	}

	if (!schema.publisher) {
		errors.push('publisher es obligatorio');
	} else {
		if (!schema.publisher.name) errors.push('publisher.name es obligatorio');
		if (!schema.publisher.logo) errors.push('publisher.logo es obligatorio');
	}

	if (!schema.mainEntityOfPage) {
		errors.push('mainEntityOfPage es obligatorio');
	}

	// OPCIONALES PERO RECOMENDADOS
	if (!schema.description) {
		warnings.push('description es recomendado para mejor SEO');
	}

	if (!schema.articleBody) {
		warnings.push('articleBody es recomendado para rich results mejorados');
	}

	if (!schema.wordCount) {
		warnings.push('wordCount es recomendado para artículos');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Valida fecha en formato RFC3339
 */
function isValidRFC3339(dateString: string): boolean {
	try {
		const date = new Date(dateString);
		return !isNaN(date.getTime());
	} catch {
		return false;
	}
}

/**
 * ============================================
 * CONSTANTES Y CONFIGURACIÓN RECOMENDADA
 * ============================================
 */

/**
 * Configuración recomendada para Centro Jurídico Internacional
 */
export const SITE_CONFIG = {
	name: 'Centro Jurídico Internacional',
	description: 'Noticias, análisis y herramientas especializadas en derecho laboral y jurídico',
	url: 'https://actualidadfrontend.vercel.app',
	logo: {
		url: 'https://actualidadfrontend.vercel.app/header/logo.svg',
		width: 250,
		height: 85
	},
	siteLanguage: 'es-CO',
	sameAs: [
		'https://www.facebook.com/centrojuridico',
		'https://www.twitter.com/centrojuridico',
		'https://www.linkedin.com/company/centro-juridico'
	],
	contactPoint: {
		type: 'ContactPoint',
		telephone: '+57 1 234 5678',
		email: 'info@centrojuridico.com'
	}
};

/**
 * Zona horaria por defecto (Colombia)
 */
export const DEFAULT_TIMEZONE = 'America/Bogota';

/**
 * Locale por defecto
 */
export const DEFAULT_LOCALE = 'es-CO';
