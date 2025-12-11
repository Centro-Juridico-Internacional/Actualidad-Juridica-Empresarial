export async function POST({ request }) {
	try {
		const body = await request.json();

		console.log('[TEST WEBHOOK] Llegó petición desde Strapi:', body);

		return new Response(
			JSON.stringify({
				ok: true,
				message: 'Conexión exitosa entre Strapi → Vercel',
				body
			}),
			{ status: 200 }
		);
	} catch (err) {
		console.error('[TEST WEBHOOK] Error:', err);
		return new Response(JSON.stringify({ ok: false, error: 'Error procesando POST' }), {
			status: 500
		});
	}
}

export async function GET() {
	return new Response(
		JSON.stringify({
			message: 'Usa POST para probar el webhook'
		}),
		{ status: 405 }
	);
}
