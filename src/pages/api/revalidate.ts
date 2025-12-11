export const prerender = false; // Este endpoint debe ser dinámico (SSR)

import type { APIRoute } from 'astro';

/**
 * Endpoint para recibir Webhooks de Strapi y ejecutar invalidación de caché en Vercel.
 * Se espera un payload de Strapi v5.
 */
export const POST: APIRoute = async ({ request }) => {
	const ISR_SECRET = import.meta.env.ISR_SECRET || process.env.ISR_SECRET;
	const VERCEL_TOKEN = import.meta.env.VERCEL_TOKEN || process.env.VERCEL_TOKEN;
	const VERCEL_PROJECT_ID = import.meta.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID;

	// 1. Validar Token de Seguridad
	const authHeader = request.headers.get('Authorization');
	if (!ISR_SECRET || authHeader !== `Bearer ${ISR_SECRET}`) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// 2. Verificar configuración de Vercel
	if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
		console.error('Faltan variables de entorno VERCEL_TOKEN o VERCEL_PROJECT_ID');
		return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const payload = await request.json();
		const { model, entry, event } = payload;

		// console.log(`[Webhook] Evento: ${event}, Modelo: ${model}, ID: ${entry?.id}`);

		// 3. Determinar Tags a invalidar
		// Mapeamos los modelos de Strapi a Cache-Tags del frontend
		const tagsToInvalidate: string[] = [];

		// Tag global para ciertos cambios (opcional)
		// tagsToInvalidate.push('all');

		switch (model) {
			case 'news': // Nombre del modelo en Strapi (singular o plural según configuración, strapi v5 suele usar singular en 'model')
			case 'noticia':
				tagsToInvalidate.push('news'); // Invalida listados de noticias
				tagsToInvalidate.push('home'); // Invalida el home (que muestra últimas noticias)
				if (entry?.slug) {
					tagsToInvalidate.push(`news-${entry.slug}`); // Invalida la noticia específica
				}
				break;

			case 'banner':
				tagsToInvalidate.push('banner');
				tagsToInvalidate.push('home'); // Banner suele estar en home
				break;

			case 'author':
			case 'autor':
				tagsToInvalidate.push('author');
				if (entry?.slug) {
					tagsToInvalidate.push(`author-${entry.slug}`);
				}
				break;

			default:
				// Por defecto, asumimos que puede afectar al home o es contenido genérico
				console.warn(
					`[Webhook] Modelo no reconocido explícitamente: ${model}, invalidando 'home' por precaución.`
				);
				tagsToInvalidate.push('home');
		}

		if (tagsToInvalidate.length === 0) {
			return new Response(JSON.stringify({ message: 'Nothing to invalidate' }), {
				status: 200
			});
		}

		// 4. Llamar a Vercel Invalidation API
		// https://vercel.com/docs/edge-network/caching#revalidating
		const vercelResponse = await fetch(
			`https://api.vercel.com/v1/projects/${VERCEL_PROJECT_ID}/invalidation`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${VERCEL_TOKEN}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tags: tagsToInvalidate
				})
			}
		);

		if (!vercelResponse.ok) {
			const errorText = await vercelResponse.text();
			console.error(`[Vercel Purge Error] ${vercelResponse.status}: ${errorText}`);
			throw new Error(`Error invalidando caché en Vercel: ${errorText}`);
		}

		const vercelResult = await vercelResponse.json();

		return new Response(
			JSON.stringify({
				message: 'Cache invalidation triggered',
				tags: tagsToInvalidate,
				vercelId: vercelResult.id
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('[Webhook Error]', error);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
