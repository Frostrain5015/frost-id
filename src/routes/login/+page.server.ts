import { redirect, fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/db/client.js';
import { users } from '$lib/server/db/schema.js';
import { eq, or } from 'drizzle-orm';
import { createSession } from '$lib/server/session.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const oauthParams = url.searchParams.get('oauth');
		if (oauthParams) throw redirect(302, `/oauth/authorize?${oauthParams}`);
		throw redirect(302, locals.user.isAdmin ? '/admin' : '/dashboard');
	}
	return { oauthParams: url.searchParams.get('oauth') };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const identifier  = (data.get('identifier') as string)?.trim();
		const password    =  data.get('password')   as string;
		const oauthParams =  data.get('oauth_params') as string | null;

		if (!identifier || !password) {
			return fail(400, { errorKey: 'login.err_required' });
		}

		// Match by email OR username (case-insensitive)
		const identifierLower = identifier.toLowerCase();
		const [user] = await db
			.select()
			.from(users)
			.where(or(
				eq(users.email,    identifierLower),
				eq(users.username, identifierLower)
			))
			.limit(1);

		if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
			return fail(401, { errorKey: 'login.err_credentials' });
		}

		await createSession(user.id, cookies);

		if (oauthParams) throw redirect(302, `/oauth/authorize?${oauthParams}`);
		throw redirect(302, user.isAdmin ? '/admin' : '/dashboard');
	}
};
