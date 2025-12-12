import type { APIRoute } from 'astro';
import { searchNews } from '@/lib/api/search';

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const query = url.searchParams.get('q');

	if (!query || query.length < 3) {
		return new Response(JSON.stringify({ products: [] }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	try {
		// Limit to 5 suggestions for performance
		const { products } = await searchNews({
			query,
			page: 1,
			pageSize: 5
		});

		return new Response(JSON.stringify({ products }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Error in search API:', error);
		return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};
