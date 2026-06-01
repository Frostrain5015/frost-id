import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { sessions, users, verificationCodes } from '$lib/server/db/schema.js';
import { and, eq, gt } from 'drizzle-orm';
import { sendPasswordResetEmail } from '$lib/server/email.js';
import type { Actions, PageServerLoad } from './$types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;

function loginRedirect(oauthParams: string | null): string {
	const params = new URLSearchParams({ reset: '1' });
	if (oauthParams) params.set('oauth', oauthParams);
	return `/login?${params.toString()}`;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(302, locals.user.isAdmin ? '/admin' : '/dashboard/account');
	}

	return {
		oauthParams: url.searchParams.get('oauth')
	};
};

export const actions: Actions = {
	requestCode: async ({ request }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();

		if (!email || !EMAIL_RE.test(email)) {
			return fail(400, { errorKey: 'forgot.err_email_invalid', email });
		}

		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (user) {
			await db
				.update(verificationCodes)
				.set({ used: true })
				.where(and(eq(verificationCodes.email, email), eq(verificationCodes.used, false)));

			const code = String(100000 + Math.floor(Math.random() * 900000));
			await db.insert(verificationCodes).values({
				id: nanoid(36),
				email,
				code,
				expiresAt: new Date(Date.now() + CODE_TTL_MS),
				used: false
			});

			try {
				await sendPasswordResetEmail(email, code);
			} catch (e) {
				console.error('[Frost ID] sendPasswordResetEmail failed:', e);
				return fail(500, { errorKey: 'forgot.err_send_failed', email });
			}
		}

		return { codeSent: true, email };
	},

	reset: async ({ request }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const code = (data.get('code') as string)?.trim();
		const password = data.get('password') as string;
		const confirmPassword = data.get('confirm_password') as string;
		const oauthParams = (data.get('oauth_params') as string | null) || null;

		if (!email || !code || !password || !confirmPassword) {
			return fail(400, { errorKey: 'forgot.err_required', email, codeSent: true });
		}
		if (!EMAIL_RE.test(email)) {
			return fail(400, { errorKey: 'forgot.err_email_invalid', email, codeSent: true });
		}
		if (password.length < 8) {
			return fail(400, { errorKey: 'forgot.err_password_short', email, codeSent: true });
		}
		if (password !== confirmPassword) {
			return fail(400, { errorKey: 'forgot.err_password_mismatch', email, codeSent: true });
		}

		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (!user) {
			return fail(400, { errorKey: 'forgot.err_code_invalid', email, codeSent: true });
		}

		const [validCode] = await db
			.select()
			.from(verificationCodes)
			.where(
				and(
					eq(verificationCodes.email, email),
					eq(verificationCodes.code, code),
					eq(verificationCodes.used, false),
					gt(verificationCodes.expiresAt, new Date())
				)
			)
			.limit(1);

		if (!validCode) {
			return fail(400, { errorKey: 'forgot.err_code_invalid', email, codeSent: true });
		}

		const passwordHash = await bcrypt.hash(password, 12);
		await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
		await db.update(verificationCodes).set({ used: true }).where(eq(verificationCodes.id, validCode.id));
		await db.delete(sessions).where(eq(sessions.userId, user.id));

		throw redirect(302, loginRedirect(oauthParams));
	}
};
