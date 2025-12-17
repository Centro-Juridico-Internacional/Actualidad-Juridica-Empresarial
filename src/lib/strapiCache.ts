/**
 * Cache en memoria para peticiones a Strapi.
 *
 * ⚠️ IMPORTANTE:
 * - Vive solo en la instancia (Vercel / Node)
 * - NO reemplaza ISR
 * - Reduce fetch duplicados en el mismo render SSR
 */

interface CacheEntry<T> {
	value: T;
	expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export function getFromCache<T>(key: string): T | null {
	const entry = memoryCache.get(key);
	if (!entry) return null;

	if (Date.now() > entry.expiresAt) {
		memoryCache.delete(key);
		return null;
	}

	return entry.value as T;
}

export function saveToCache<T>(key: string, value: T, ttlMs: number): void {
	memoryCache.set(key, {
		value,
		expiresAt: Date.now() + ttlMs
	});
}
