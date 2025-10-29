const STRAPI_HOST = process.env.STRAPI_HOST ?? import.meta.env.STRAPI_HOST;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN ?? import.meta.env.STRAPI_TOKEN;

function isAbsoluteUrl(u?: string | null) {
	return !!u && /^https?:\/\//i.test(u);
}

function withHost(u?: string | null) {
	if (!u) return null;
	return isAbsoluteUrl(u) ? u : `${STRAPI_HOST}${u}`;
}

export async function query(path: string) {
	const res = await fetch(`${STRAPI_HOST}/api/${path}`, {
		headers: {
			Authorization: `Bearer ${STRAPI_TOKEN}`
		},
		// @vercel/edge compatible
		cache: 'no-store'
	});

	if (!res.ok) {
		throw new Error('Network response was not ok');
	}
	return res.json();
}

export { withHost };
