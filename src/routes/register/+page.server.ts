import { redirect, fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { users, verificationCodes } from '$lib/server/db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { createSession } from '$lib/server/session.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		throw redirect(302, locals.user.isAdmin ? '/admin' : '/dashboard');
	}
	return { oauthParams: url.searchParams.get('oauth') };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const name           = (data.get('name')            as string)?.trim();
		const email          = (data.get('email')           as string)?.trim().toLowerCase();
		const password       =  data.get('password')        as string;
		const confirmPassword=  data.get('confirm_password')as string;
		const code           =  data.get('code')            as string;
		const oauthParams    =  data.get('oauth_params')    as string | null;

		if (!name || !email || !password || !confirmPassword || !code) {
			return fail(400, { errorKey: 'register.err_required' });
		}
		if (password.length < 8) {
			return fail(400, { errorKey: 'register.err_password_short' });
		}
		if (password !== confirmPassword) {
			return fail(400, { errorKey: 'register.err_password_mismatch' });
		}

		// Verify the code
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
			return fail(400, { errorKey: 'register.err_code_invalid' });
		}

		// Check email still not taken (could have been registered between code send and submit)
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
		if (existing) {
			return fail(409, { errorKey: 'register.err_email_taken' });
		}

		// Mark code as used
		await db
			.update(verificationCodes)
			.set({ used: true })
			.where(eq(verificationCodes.id, validCode.id));

		// Create user
		const passwordHash = await bcrypt.hash(password, 12);
		const userId = nanoid(36);
		await db.insert(users).values({
			id: userId,
			email,
			name,
			passwordHash,
			isAdmin: false
		});

		await createSession(userId, cookies);

		if (oauthParams) throw redirect(302, `/oauth/authorize?${oauthParams}`);
		throw redirect(302, '/dashboard');
	}
};
