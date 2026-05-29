import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { db } from './db/client.js';
import { sessions, users, scopes } from './db/schema.js';
import { eq, lt } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '$env/static/private';

const SESSION_COOKIE = 'frost_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function getSessionUser(cookies: Cookies) {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (!sessionId) return null;

	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.id, sessionId))
		.limit(1);
	if (!session || session.expiresAt < new Date()) {
		cookies.delete(SESSION_COOKIE, { path: '/' });
		return null;
	}

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, session.userId))
		.limit(1);
	return user ?? null;
}

export async function createSession(userId: string, cookies: Cookies): Promise<void> {
	const id = nanoid(36);
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	await db.insert(sessions).values({ id, userId, expiresAt });
	cookies.set(SESSION_COOKIE, id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		secure: process.env.NODE_ENV === 'production'
	});
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function ensureSeeded(): Promise<void> {
	const [admin] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.isAdmin, true))
		.limit(1);
	if (admin) return;

	const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
	await db.insert(users).values({
		id: nanoid(36),
		email: ADMIN_EMAIL,
		username: 'admin',
		passwordHash,
		isAdmin: true
	});

	const defaultScopes = [
		{ name: 'openid', description: 'OpenID Connect basic identity' },
		{ name: 'profile', description: 'User profile information' },
		{ name: 'email', description: 'User email address' },
		{ name: 'offline_access', description: 'Issue refresh tokens' }
	];
	for (const s of defaultScopes) {
		try {
			await db.insert(scopes).values(s);
		} catch {
			// scope already exists, skip
		}
	}
}
