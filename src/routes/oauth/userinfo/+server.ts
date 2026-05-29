import { json } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db/client.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler  = ({ request }) => userinfo(request);
export const POST: RequestHandler = ({ request }) => userinfo(request);

async function userinfo(request: Request): Promise<Response> {
	const auth = request.headers.get('Authorization') ?? '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;

	if (!token) {
		return json({ error: 'invalid_token', error_description: 'Missing Bearer token' }, {
			status: 401,
			headers: { 'WWW-Authenticate': 'Bearer realm="frost-id"' }
		});
	}

	let sub: string;
	try {
		const secret = new TextEncoder().encode(JWT_SECRET);
		const { payload } = await jwtVerify(token, secret);
		sub = payload.sub as string;
		if (!sub) throw new Error('JWT has no sub claim');
	} catch {
		return json({ error: 'invalid_token', error_description: 'Invalid or expired token' }, { status: 401 });
	}

	const [user] = await db
		.select({ id: users.id, email: users.email, username: users.username })
		.from(users)
		.where(eq(users.id, sub))
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
