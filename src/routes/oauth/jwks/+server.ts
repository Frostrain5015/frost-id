import { json } from '@sveltejs/kit';
import { getJWKS } from '$lib/server/oidc/keys.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const jwks = await getJWKS();
	return json(jwks, {
		headers: { 'Cache-Control': 'public, max-age=3600' }
	});
};
