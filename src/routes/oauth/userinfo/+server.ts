import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client.js';
import { accessTokens, users } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	return handleUserinfo(request);
};

export const POST: RequestHandler = async ({ request }) => {
	return handleUserinfo(request);
};

async function handleUserinfo(request: Request): Promise<Response> {
	// Accept Bearer token from Authorization header
	const auth = request.headers.get('Authorization') ?? '';
	const bearerToken = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;

	if (!bearerToken) {
		return json({ error: 'invalid_token', error_description: 'Missing Bearer token' }, { status: 401 });
	}

	// The access token is a JWT signed by Frost ID.
	// The token's `jti` claim matches the `access_token` column in the DB.
	// Decode the JWT payload (no verification needed for DB lookup).
	let jti: string | null = null;
	try {
		const parts = bearerToken.split('.');
		if (parts.length === 3) {
			const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
			jti = payload.jti ?? null;
		}
	} catch {
		// fall through — also try looking up the raw token string
	}

	// Look up token by jti OR by the raw token string (in case issuer stores full JWT)
	const lookup = jti ?? bearerToken;
	const [tokenRow] = await db
		.select()
		.from(accessTokens)
		.where(and(eq(accessTokens.accessToken, lookup), eq(accessTokens.revoked, false)))
		.limit(1);

	if (!tokenRow || tokenRow.accessTokenExpiresAt < new Date()) {
		return json({ error: 'invalid_token', error_description: 'Token expired or revoked' }, { status: 401 });
	}

	if (!tokenRow.userId) {
		return json({ error: 'invalid_token', error_description: 'No user associated with token' }, { status: 400 });
	}

	const [user] = await db
		.select({ id: users.id, email: users.email, username: users.username, isAdmin: users.isAdmin })
		.from(users)
		.where(eq(users.id, tokenRow.userId))
		.limit(1);

	if (!user) {
		return json({ error: 'invalid_token', error_description: 'User not found' }, { status: 404 });
	}

	return json({
		sub: user.id,
		email: user.email,
		preferred_username: user.username,
		username: user.username
	});
}
