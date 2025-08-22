import dotenv from 'dotenv';
dotenv.config();

const { STRAPI_HOST, STRAPI_TOKEN } = process.env;

export function query(url: string) {
	return fetch(`${STRAPI_HOST}/api/${url}`, {
		headers: {
			Authorization: `Bearer ${STRAPI_TOKEN}`
		}
	}).then((res) => {
		if (!res.ok) {
			throw new Error('Network response was not ok');
		}
		return res.json();
	});
}
