import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const target = url.searchParams.get('url');

	if (!target) {
		return new Response('Missing url param', { status: 400 });
	}

	try {
		const upstream = await fetch(target, {
			method: 'GET',
			// importante: algunos servidores rechazan sin UA
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
				Accept: 'application/pdf'
			},
			// evita cache raro en dev
			cache: 'no-store'
		});

		if (!upstream.ok) {
			return new Response(`Upstream error: ${upstream.status} ${upstream.statusText}`, {
				status: upstream.status
			});
		}

		const contentType = upstream.headers.get('content-type') || 'application/pdf';

		// ✅ streaming
		return new Response(upstream.body, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'no-store',
				// permite que pdfjs no muera con range
				'Accept-Ranges': 'bytes'
			}
		});
	} catch (err: any) {
		return new Response(`Proxy failed: ${String(err?.message ?? err)}`, {
			status: 500
		});
	}
};
