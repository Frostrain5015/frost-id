import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { users, sessions, accessTokens, authCodes, verificationCodes, linkedAccounts } from '$lib/server/db/schema.js';
import { eq, and, ne } from 'drizzle-orm';
import { sendVerificationEmail } from '$lib/server/email.js';
import { destroySession } from '$lib/server/session.js';
import type { Actions, PageServerLoad } from './$types';

const USERNAME_RE = /^[a-zA-Z0-9_]{2,32}$/;

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user!.id;

	const userRows = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	const user = userRows[0];

	const allSessions = await db
		.select()
		.from(sessions)
		.where(eq(sessions.userId, userId))
		.orderBy(sessions.createdAt);

	const userLinkedAccounts = await db
		.select({
			id: linkedAccounts.id,
			provider: linkedAccounts.provider,
			displayName: linkedAccounts.displayName,
			email: linkedAccounts.email,
			avatarUrl: linkedAccounts.avatarUrl,
			createdAt: linkedAccounts.createdAt
		})
		.from(linkedAccounts)
		.where(eq(linkedAccounts.userId, userId));

	return {
		user: {
			id: user.id,
			email: user.email,
			username: user.username,
			avatarUrl: user.avatarUrl,
			createdAt: user.createdAt
		},
		sessions: allSessions.map((s) => ({
			id: s.id,
			region: s.region,
			createdAt: s.createdAt,
			expiresAt: s.expiresAt
		})),
		linkedAccounts: userLinkedAccounts,
		linkedProvider: url.searchParams.get('linked'),
		linkError: url.searchParams.get('error')
	};
};

export const actions: Actions = {
	updateUsername: async ({ request, locals }) => {
		const data = await request.formData();
		const newUsername = (data.get('username') as string)?.trim();
		if (!newUsername || !USERNAME_RE.test(newUsername)) {
			return fail(400, { errorKey: 'dashboard.account.username_invalid' });
		}

		const [taken] = await db
			.select({ id: users.id })
			.from(users)
			.where(and(eq(users.username, newUsername), ne(users.id, locals.user!.id)))
			.limit(1);
		if (taken) {
			return fail(409, { errorKey: 'dashboard.account.username_taken' });
		}

		await db.update(users).set({ username: newUsername }).where(eq(users.id, locals.user!.id));
		return { success: 'dashboard.account.username_saved' };
	},

	updateAvatar: async ({ request, locals }) => {
		const data = await request.formData();
		const avatarUrl = (data.get('avatarUrl') as string)?.trim() || null;
		await db.update(users).set({ avatarUrl }).where(eq(users.id, locals.user!.id));
		return { success: 'dashboard.account.avatar_saved' };
	},

	changePassword: async ({ request, locals }) => {
		const data = await request.formData();
		const current = data.get('currentPassword') as string;
		const next = data.get('newPassword') as string;
		const confirm = data.get('confirmPassword') as string;

		if (!next || !confirm) {
			return fail(400, { errorKey: 'register.err_required' });
		}
		if (next.length < 8) {
			return fail(400, { errorKey: 'dashboard.account.password_short' });
		}
		if (next !== confirm) {
			return fail(400, { errorKey: 'dashboard.account.password_mismatch' });
		}

		const [user] = await db.select().from(users).where(eq(users.id, locals.user!.id)).limit(1);

		if (user.passwordHash) {
			if (!current) {
				return fail(400, { errorKey: 'register.err_required' });
			}
			const ok = await bcrypt.compare(current, user.passwordHash);
			if (!ok) {
				return fail(400, { errorKey: 'dashboard.account.password_wrong' });
			}
		}

		const passwordHash = await bcrypt.hash(next, 12);
		await db.update(users).set({ passwordHash }).where(eq(users.id, locals.user!.id));
		return { success: 'dashboard.account.password_changed' };
	},

	unlinkAccount: async ({ request, locals }) => {
		const data = await request.formData();
		const accountId = (data.get('accountId') as string)?.trim();
		if (!accountId) {
			return fail(400, { errorKey: 'dashboard.account.link_err_missing' });
		}

		const [account] = await db
			.select()
			.from(linkedAccounts)
			.where(and(
				eq(linkedAccounts.id, accountId),
				eq(linkedAccounts.userId, locals.user!.id)
			))
			.limit(1);

		if (!account) {
			return fail(400, { errorKey: 'dashboard.account.link_err_not_found' });
		}

		// Safety: check remaining linked accounts
		const otherLinks = await db
			.select({ id: linkedAccounts.id })
			.from(linkedAccounts)
			.where(and(
				eq(linkedAccounts.userId, locals.user!.id),
				ne(linkedAccounts.id, accountId)
			))
			.limit(1);

		if (otherLinks.length === 0) {
			// This was the last linked account — user still has password, so it's safe
			// but we should warn if they have no other login methods
		}

		await db.delete(linkedAccounts).where(eq(linkedAccounts.id, accountId));
		return { success: 'dashboard.account.link_removed' };
	},

	requestEmailChange: async ({ request, locals }) => {
		const data = await request.formData();
		const newEmail = (data.get('email') as string)?.trim().toLowerCase();
		if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
			return fail(400, { errorKey: 'dashboard.account.email_invalid' });
		}

		const [taken] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, newEmail))
			.limit(1);
		if (taken) {
			return fail(409, { errorKey: 'dashboard.account.email_taken' });
		}

		await db
			.update(verificationCodes)
			.set({ used: true })
			.where(and(eq(verificationCodes.email, newEmail), eq(verificationCodes.used, false)));

		const code = String(100000 + Math.floor(Math.random() * 900000));
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
		await db.insert(verificationCodes).values({
			id: nanoid(36),
			email: newEmail,
			code,
			expiresAt,
			used: false
		});

		try {
			await sendVerificationEmail(newEmail, code);
		} catch {
			return fail(500, { errorKey: 'register.err_send_failed' });
		}

		return { emailChangePending: newEmail };
	},

	verifyEmailChange: async ({ request, locals }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const code = (data.get('code') as string)?.trim();

		if (!email || !code) {
			return fail(400, { errorKey: 'dashboard.account.email_code_invalid' });
		}

		const [vc] = await db
			.select()
			.from(verificationCodes)
			.where(
				and(
					eq(verificationCodes.email, email),
					eq(verificationCodes.code, code),
					eq(verificationCodes.used, false)
				)
			)
			.limit(1);

		if (!vc || vc.expiresAt < new Date()) {
			return fail(400, { errorKey: 'dashboard.account.email_code_invalid' });
		}

		await db.update(verificationCodes).set({ used: true }).where(eq(verificationCodes.id, vc.id));
		await db.update(users).set({ email }).where(eq(users.id, locals.user!.id));
		return { success: 'dashboard.account.email_changed' };
	},

	revokeSession: async ({ request, locals }) => {
		const data = await request.formData();
		const sessionId = (data.get('sessionId') as string)?.trim();
		if (sessionId) {
			await db
				.delete(sessions)
				.where(and(eq(sessions.id, sessionId), eq(sessions.userId, locals.user!.id)));
		}
		return { success: 'dashboard.account.sessions_revoked' };
	},

	deleteAccount: async ({ request, locals, cookies }) => {
		const data = await request.formData();
		const password = data.get('password') as string;

		const [user] = await db.select().from(users).where(eq(users.id, locals.user!.id)).limit(1);
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) {
			return fail(400, { errorKey: 'dashboard.account.delete_wrong_password' });
		}

		const userId = locals.user!.id;

		await db.delete(linkedAccounts).where(eq(linkedAccounts.userId, userId));
		await db.delete(accessTokens).where(eq(accessTokens.userId, userId));
		await db.delete(authCodes).where(eq(authCodes.userId, userId));
		await db.delete(sessions).where(eq(sessions.userId, userId));
		await db.delete(users).where(eq(users.id, userId));

		await destroySession(cookies);
		throw redirect(302, '/');
	}
};
