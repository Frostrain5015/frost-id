import { redirect, error, fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { users, pendingRegistrations, verificationCodes } from '$lib/server/db/schema.js';
import { eq, and, gt, or } from 'drizzle-orm';
import { createSession } from '$lib/server/session.js';
import { sendVerificationEmail } from '$lib/server/email.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(302, locals.user.isAdmin ? '/admin' : '/dashboard');
	}

	const token = url.searchParams.get('token');
	if (!token) throw error(400, 'Missing token');

	const [pending] = await db
		.select({ id: pendingRegistrations.id, email: pendingRegistrations.email, expiresAt: pendingRegistrations.expiresAt })
		.from(pendingRegistrations)
		.where(eq(pendingRegistrations.id, token))
		.limit(1);

	if (!pending || pending.expiresAt < new Date()) {
		throw redirect(302, '/register?expired=1');
	}

	// Mask email for display: user@example.com → u***@example.com
	const [local, domain] = pending.email.split('@');
	const maskedEmail = local.slice(0, 1) + '***@' + domain;

	return { token, maskedEmail, email: pending.email };
};

export const actions: Actions = {
	verify: async ({ request, cookies }) => {
		const data  = await request.formData();
		const token = data.get('token') as string;
		const code  = (data.get('code') as string)?.trim();

		if (!token || !code) {
			return fail(400, { errorKey: 'register.err_required' });
		}

		const [pending] = await db
			.select()
			.from(pendingRegistrations)
			.where(eq(pendingRegistrations.id, token))
			.limit(1);

		if (!pending || pending.expiresAt < new Date()) {
			return fail(410, { errorKey: 'register.err_expired', expired: true });
		}

		// Check verification code
		const [validCode] = await db
			.select()
			.from(verificationCodes)
			.where(
				and(
					eq(verificationCodes.email, pending.email),
					eq(verificationCodes.code, code),
					eq(verificationCodes.used, false),
					gt(verificationCodes.expiresAt, new Date())
				)
			)
			.limit(1);

		if (!validCode) {
			return fail(400, { errorKey: 'register.err_code_invalid' });
		}

		// Re-check for conflicts (race condition guard)
		const [conflict] = await db
			.select({ id: users.id })
			.from(users)
			.where(or(eq(users.email, pending.email), eq(users.username, pending.username)))
			.limit(1);

		if (conflict) {
			return fail(409, { errorKey: 'register.err_email_taken' });
		}

		// Mark code used
		await db.update(verificationCodes).set({ used: true }).where(eq(verificationCodes.id, validCode.id));

		// Create user
		const userId = nanoid(36);
		await db.insert(users).values({
			id: userId,
			email: pending.email,
			username: pending.username,
			passwordHash: pending.passwordHash,
			isAdmin: false
		});

		// Clean up pending registration
		await db.delete(pendingRegistrations).where(eq(pendingRegistrations.id, token));

		await createSession(userId, cookies);

		const oauthParams = pending.oauthParams;
		if (oauthParams) throw redirect(302, `/oauth/authorize?${oauthParams}`);
		throw redirect(302, '/dashboard');
	},

	resend: async ({ request }) => {
		const data  = await request.formData();
		const token = data.get('token') as string;

		const [pending] = await db
			.select({ email: pendingRegistrations.email, expiresAt: pendingRegistrations.expiresAt })
			.from(pendingRegistrations)
			.where(eq(pendingRegistrations.id, token))
			.limit(1);

		if (!pending || pending.expiresAt < new Date()) {
			return fail(410, { errorKey: 'register.err_expired', expired: true });
		}

		// Invalidate old codes and issue new one
		await db.update(verificationCodes).set({ used: true }).where(eq(verificationCodes.email, pending.email));
		const newCode = String(100000 + Math.floor(Math.random() * 900000));
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
		await db.insert(verificationCodes).values({
			id: nanoid(36),
			email: pending.email,
			code: newCode,
			expiresAt,
			used: false
		});

		try {
			await sendVerificationEmail(pending.email, newCode);
		} catch {
			return fail(500, { errorKey: 'register.err_send_failed' });
		}

		return { resent: true };
	}
};
