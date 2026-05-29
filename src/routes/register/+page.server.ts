import { redirect, fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { users, pendingRegistrations, verificationCodes } from '$lib/server/db/schema.js';
import { eq, or } from 'drizzle-orm';
import { sendVerificationEmail } from '$lib/server/email.js';
import type { Actions, PageServerLoad } from './$types';

const USERNAME_RE = /^[a-zA-Z0-9_]{2,32}$/;

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(302, locals.user.isAdmin ? '/admin' : '/dashboard');
	}
	return { oauthParams: url.searchParams.get('oauth') };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const username      = (data.get('username')         as string)?.trim();
		const email         = (data.get('email')            as string)?.trim().toLowerCase();
		const password      =  data.get('password')         as string;
		const confirmPass   =  data.get('confirm_password') as string;
		const oauthParams   =  data.get('oauth_params')     as string | null;

		if (!username || !email || !password || !confirmPass) {
			return fail(400, { errorKey: 'register.err_required' });
		}
		if (!USERNAME_RE.test(username)) {
			return fail(400, { errorKey: 'register.err_username_invalid' });
		}
		if (password.length < 8) {
			return fail(400, { errorKey: 'register.err_password_short' });
		}
		if (password !== confirmPass) {
			return fail(400, { errorKey: 'register.err_password_mismatch' });
		}

		// Check for conflicts up-front (fast-fail)
		const [conflict] = await db
			.select({ id: users.id })
			.from(users)
			.where(or(eq(users.email, email), eq(users.username, username)))
			.limit(1);

		if (conflict) {
			// Determine which field conflicts
			const [byEmail] = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, email))
				.limit(1);
			return fail(409, { errorKey: byEmail ? 'register.err_email_taken' : 'register.err_username_taken' });
		}

		// Hash password and store pending registration (replace any existing for this email)
		const passwordHash = await bcrypt.hash(password, 12);
		await db.delete(pendingRegistrations).where(eq(pendingRegistrations.email, email));

		const pendingId = nanoid(36);
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
		await db.insert(pendingRegistrations).values({
			id: pendingId,
			username,
			email,
			passwordHash,
			oauthParams: oauthParams || null,
			expiresAt
		});

		// Send verification code
		const code = String(100000 + Math.floor(Math.random() * 900000));
		const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

		// Invalidate any existing codes for this email
		await db
			.update(verificationCodes)
			.set({ used: true })
			.where(eq(verificationCodes.email, email));

		await db.insert(verificationCodes).values({
			id: nanoid(36),
			email,
			code,
			expiresAt: codeExpiresAt,
			used: false
		});

		try {
			await sendVerificationEmail(email, code);
		} catch {
			return fail(500, { errorKey: 'register.err_send_failed' });
		}

		throw redirect(302, `/register/verify?token=${pendingId}`);
	}
};
