import { redirect, fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { users, linkedAccounts, pendingSocialRegistrations } from '$lib/server/db/schema.js';
import { eq, or } from 'drizzle-orm';
import { createSession } from '$lib/server/session.js';
import type { Actions, PageServerLoad } from './$types';

const USERNAME_RE = /^[a-zA-Z0-9_]{2,32}$/;

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	if (!token) throw redirect(302, '/login');

	const [pending] = await db
		.select()
		.from(pendingSocialRegistrations)
		.where(eq(pendingSocialRegistrations.id, token))
		.limit(1);

	if (!pending || pending.expiresAt < new Date()) {
		if (pending) {
			await db.delete(pendingSocialRegistrations).where(eq(pendingSocialRegistrations.id, pending.id));
		}
		return { expired: true, profile: null, token: null };
	}

	return {
		expired: false,
		profile: {
			email: pending.email,
			username: pending.username,
			avatarUrl: pending.avatarUrl,
			provider: pending.provider,
			displayName: pending.displayName
		},
		token
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const token = (data.get('token') as string)?.trim();
		const username = (data.get('username') as string)?.trim();
		const password = data.get('password') as string;
		const confirmPassword = data.get('confirm_password') as string;

		if (!token || !username || !password || !confirmPassword) {
			return fail(400, { errorKey: 'register.err_required', token });
		}
		if (!USERNAME_RE.test(username)) {
			return fail(400, { errorKey: 'register.err_username_invalid', token });
		}
		if (password.length < 8) {
			return fail(400, { errorKey: 'register.err_password_short', token });
		}
		if (password !== confirmPassword) {
			return fail(400, { errorKey: 'register.err_password_mismatch', token });
		}

		// Consume the pending registration
		const [pending] = await db
			.select()
			.from(pendingSocialRegistrations)
			.where(eq(pendingSocialRegistrations.id, token))
			.limit(1);

		if (!pending || pending.expiresAt < new Date()) {
			if (pending) {
				await db.delete(pendingSocialRegistrations).where(eq(pendingSocialRegistrations.id, pending.id));
			}
			return fail(400, { errorKey: 'register.err_expired' });
		}

		// Check username/email conflicts (use the user-chosen username)
		const [conflict] = await db
			.select({ id: users.id })
			.from(users)
			.where(or(eq(users.email, pending.email), eq(users.username, username)))
			.limit(1);

		if (conflict) {
			const [byEmail] = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, pending.email))
				.limit(1);
			return fail(409, {
				errorKey: byEmail ? 'register.err_email_taken' : 'register.err_username_taken',
				token
			});
		}

		// Create the user
		const passwordHash = await bcrypt.hash(password, 12);
		const userId = nanoid(36);

		await db.insert(users).values({
			id: userId,
			email: pending.email,
			username,
			passwordHash,
			avatarUrl: pending.avatarUrl,
			isAdmin: false
		});

		// Create the linked account
		await db.insert(linkedAccounts).values({
			id: nanoid(36),
			userId,
			provider: pending.provider,
			providerAccountId: pending.providerAccountId,
			displayName: pending.displayName,
			email: pending.email,
			avatarUrl: pending.avatarUrl,
			accessToken: null,
			refreshToken: null,
			expiresAt: null
		});

		// Delete the pending registration
		await db.delete(pendingSocialRegistrations).where(eq(pendingSocialRegistrations.id, token));

		// Create session
		const forwarded = request.headers.get('x-forwarded-for');
		const ip = forwarded?.split(',')[0]?.trim();
		await createSession(userId, cookies, ip);

		// Continue OAuth flow if applicable
		if (pending.oauthParams) {
			throw redirect(302, `/oauth/authorize?${pending.oauthParams}`);
		}

		throw redirect(302, '/dashboard');
	}
};
