import { json } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db/client.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler  = ({ request }) => userinfo(request);
export const POST: RequestHandler = ({ request }) => userinfo(request);

function verifyHS256(token: string, secret: string): Record<string, unknown> | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const [header, payload, sigB64url] = parts;

		const expected = createHmac('sha256', secret)
			.update(`${header}.${payload}`)
			.digest();
		const actual = Buffer.from(sigB64url, 'base64url');
		if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

		const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as Record<string, unknown>;

		if (typeof data.exp === 'number' && data.exp < Date.now() / 1000) return null;

		return data;
	} catch {
		return null;
	}
}

async function userinfo(request: Request): Promise<Response> {
	const auth = request.headers.get('Authorization') ?? '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;

	if (!token) {
		return json({ error: 'invalid_token', error_description: 'Missing Bearer token' }, { status: 401 });
	}

	const payload = verifyHS256(token, JWT_SECRET);
	if (!payload) {
		return json({ error: 'invalid_token', error_description: 'Invalid or expired token' }, { status: 401 });
	}

	const sub = (payload.sub as string) ?? (payload.jti as string);
	if (!sub) {
		return json({ error: 'invalid_token', error_description: 'No sub or jti' }, { status: 401 });
	}

	const scopes = typeof payload.scope === 'string'
		? payload.scope.split(' ')
		: Array.isArray(payload.scopes) ? payload.scopes as string[] : [];

	const [user] = await db
		.select({
			id: users.id,
			email: users.email,
			username: users.username,
			avatarUrl: users.avatarUrl
		})
		.from(users)
		.where(eq(users.id, sub))
		.limit(1);

	if (!user) {
		return json({ error: 'invalid_token', error_description: 'User not found' }, { status: 404 });
	}

	const claims: Record<string, unknown> = { sub: user.id };

	if (scopes.includes('profile') || scopes.length === 0) {
		claims.preferred_username = user.username;
		claims.username = user.username;
		if (user.avatarUrl) claims.picture = user.avatarUrl;
	}

	if (scopes.includes('email') || scopes.length === 0) {
		claims.email = user.email;
		claims.email_verified = true;
	}

	return json(claims);
}
