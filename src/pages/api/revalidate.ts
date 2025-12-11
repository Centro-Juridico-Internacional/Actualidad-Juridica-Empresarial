export const prerender = false;

import type { APIRoute } from 'astro';

const ISR_SECRET = process.env.ISR_SECRET ?? import.meta.env.ISR_SECRET;
const BYPASS_TOKEN = process.env.VERCEL_ISR_BYPASS_TOKEN ?? import.meta.env.VERCEL_ISR_BYPASS_TOKEN;

/**
 * Endpoint que recibe el Webhook de Strapi y marca rutas para
 * revalidación en Vercel ISR (granular por modelo / slug).
 */
export const POST: APIRoute = async ({ request }) => {
	// 1. Validar token de Strapi
	const authHeader = request.headers.get('authorization');
	if (!ISR_SECRET || authHeader !== `Bearer ${ISR_SECRET}`) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (!BYPASS_TOKEN) {
		console.error('Falta VERCEL_ISR_BYPASS_TOKEN en variables de entorno');
		return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// 2. Leer payload
	const payload = await request.json().catch(() => null);
	if (!payload) {
		return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const { model, entry } = payload as {
		model?: string;
		entry?: any;
	};

	const pathsToRevalidate: string[] = [];

	// 3. Mapear modelo de Strapi -> rutas a revalidar
	switch (model) {
		case 'news':
		case 'noticia': {
			pathsToRevalidate.push('/'); // home
			pathsToRevalidate.push('/categorias'); // listado de categorías

			// noticia individual
			if (entry?.slug) {
				pathsToRevalidate.push(`/noticia/${entry.slug}`);
			}

			// categorías de la noticia
			const categorias = entry?.categorias ?? entry?.categories ?? entry?.category ?? [];
			const catArray = Array.isArray(categorias) ? categorias : (categorias?.data ?? []);

			for (const cat of catArray) {
				const slug = cat?.slug ?? cat?.attributes?.slug ?? cat?.attributes?.name ?? cat?.name;
				if (slug && typeof slug === 'string') {
					pathsToRevalidate.push(`/categorias/${slug}`);
				}
			}

			// páginas de autor
			const autor = entry?.autor ?? entry?.author ?? entry?.authorRef ?? entry?.autorRef;
			const autorName = autor?.name ?? autor?.Nombre ?? autor?.titulo;
			if (autorName && typeof autorName === 'string') {
				const authorSlug = autorName.toLowerCase().replace(/\s+/g, '_');
				pathsToRevalidate.push('/autores');
				pathsToRevalidate.push(`/autores/${authorSlug}`);
			}
			break;
		}

		case 'banner': {
			pathsToRevalidate.push('/');
			break;
		}

		case 'author':
		case 'autor': {
			pathsToRevalidate.push('/autores');
			if (entry?.name || entry?.Nombre) {
				const name = (entry.name ?? entry.Nombre) as string;
				const slug = name.toLowerCase().replace(/\s+/g, '_');
				pathsToRevalidate.push(`/autores/${slug}`);
			}
			pathsToRevalidate.push('/');
			break;
		}

		case 'categories':
		case 'category': {
			pathsToRevalidate.push('/categorias');
			if (entry?.slug) {
				pathsToRevalidate.push(`/categorias/${entry.slug}`);
			}
			pathsToRevalidate.push('/');
			break;
		}

		case 'entrevistas-urls':
		case 'imagenes-pautas':
		case 'event-banner':
		case 'banners-eventos': {
			pathsToRevalidate.push('/');
			break;
		}

		default: {
			console.warn(`[Webhook] Modelo no mapeado explícitamente: ${model}, revalidando home.`);
			pathsToRevalidate.push('/');
		}
	}

	const uniquePaths = Array.from(new Set(pathsToRevalidate));

	// 4. Revalidar rutas haciendo HEAD con x-prerender-revalidate
	const host = request.headers.get('host');
	const proto = request.headers.get('x-forwarded-proto') ?? 'https';

	if (!host) {
		console.error('No se pudo determinar el host desde la request');
		return new Response(JSON.stringify({ error: 'Missing host header' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const results: Record<string, string | null> = {};

	for (const path of uniquePaths) {
		const url = `${proto}://${host}${path}`;

		try {
			const res = await fetch(url, {
				method: 'HEAD',
				headers: {
					'x-prerender-revalidate': BYPASS_TOKEN as string
				}
			});

			const cacheStatus = res.headers.get('x-vercel-cache');
			results[path] = cacheStatus;

			console.log(
				`[ISR] Revalidate ${path} -> status ${res.status}, x-vercel-cache=${cacheStatus}`
			);
		} catch (err) {
			console.error(`[ISR] Error revalidando ${path}:`, err);
			results[path] = null;
		}
	}

	return new Response(
		JSON.stringify({
			ok: true,
			model,
			entryId: entry?.id ?? null,
			revalidated: uniquePaths,
			cache: results
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		}
	);
};

export async function GET() {
	return new Response(
		JSON.stringify({
			message: 'Use POST desde Strapi para revalidar rutas.'
		}),
		{
			status: 405,
			headers: { 'Content-Type': 'application/json' }
		}
	);
}
