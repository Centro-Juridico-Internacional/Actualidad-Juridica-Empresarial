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
		console.error('[ISR] Falta VERCEL_ISR_BYPASS_TOKEN');
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

	const { model, entry } = payload as { model?: string; entry?: any };
	const pathsToRevalidate: string[] = [];

	switch (model) {
		case 'news':
		case 'noticia': {
			pathsToRevalidate.push('/');
			pathsToRevalidate.push('/categorias');

			if (entry?.slug) {
				pathsToRevalidate.push(`/noticia/${entry.slug}`);
			}

			const categorias = entry?.categorias ?? entry?.categories ?? [];
			const catArray = Array.isArray(categorias) ? categorias : (categorias?.data ?? []);

			for (const cat of catArray) {
				const slug = cat?.slug ?? cat?.attributes?.slug;
				if (slug) {
					pathsToRevalidate.push(`/categorias/${slug}`);
				}
			}
			break;
		}

		case 'banner':
		case 'entrevistas-urls':
		case 'capsulas-legales-urls':
		case 'imagenes-pautas':
		case 'banners-eventos': {
			pathsToRevalidate.push('/');
			break;
		}

		case 'author':
		case 'autor': {
			pathsToRevalidate.push('/autores', '/');
			break;
		}

		case 'categories':
		case 'category': {
			pathsToRevalidate.push('/categorias', '/');
			if (entry?.slug) {
				pathsToRevalidate.push(`/categorias/${entry.slug}`);
			}
			break;
		}

		default: {
			console.warn(`[ISR] Modelo no mapeado: ${model}, revalidando home.`);
			pathsToRevalidate.push('/');
		}
	}

	const uniquePaths = Array.from(new Set(pathsToRevalidate));

	const host = request.headers.get('host');
	const proto = request.headers.get('x-forwarded-proto') ?? 'https';

	if (!host) {
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
				headers: { 'x-prerender-revalidate': BYPASS_TOKEN as string }
			});
			results[path] = res.headers.get('x-vercel-cache');
		} catch {
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
		{ status: 200, headers: { 'Content-Type': 'application/json' } }
	);
};

export async function GET() {
	return new Response(JSON.stringify({ message: 'Use POST desde Strapi para revalidar rutas.' }), {
		status: 405,
		headers: { 'Content-Type': 'application/json' }
	});
}
