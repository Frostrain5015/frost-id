import { redirect, error, fail } from '@sveltejs/kit';
import { responseToVanilla } from '@jmondi/oauth2-server/vanilla';
import type { OAuthResponse } from '@jmondi/oauth2-server';
import { authorizationServer } from '$lib/server/oauth/server.js';
import { getPending, getPendingOAuthParams, getPendingNonce, deletePending } from '$lib/server/oauth/pending.js';
import { destroySession } from '$lib/server/session.js';
import { db } from '$lib/server/db/client.js';
import { authCodes } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const pid = url.searchParams.get('pid');
	if (!pid) throw error(400, 'Missing pending authorization ID');

	if (!locals.user) {
		const oauthParams = getPendingOAuthParams(pid);
		throw redirect(302, oauthParams ? `/login?oauth=${encodeURIComponent(oauthParams)}` : '/login');
	}

	const authRequest = getPending(pid);
	if (!authRequest) throw error(400, 'Authorization request expired.');

	return {
		pid,
		clientName: authRequest.client.name,
		scopes: authRequest.scopes.map((s) => s.name),
		user: { email: locals.user.email }
	};
};

export const actions: Actions = {
	approve: async ({ locals, request }) => {
		if (!locals.user) throw redirect(302, '/login');

		const data = await request.formData();
		const pid = data.get('pid') as string;

		const authRequest = getPending(pid);
		if (!authRequest) return fail(400, { errorKey: 'consent.err_expired' });

		const nonce = getPendingNonce(pid);

		authRequest.user = { id: locals.user.id };
		authRequest.isAuthorizationApproved = true;

		try {
			const oauthRes = await authorizationServer.completeAuthorizationRequest(authRequest);
			deletePending(pid);

			const vanillaResponse = responseToVanilla(oauthRes as unknown as OAuthResponse);
			if (vanillaResponse.status === 302) {
				const location = vanillaResponse.headers.get('location');
				if (location) {
					if (nonce) {
						try {
							const code = new URL(location).searchParams.get('code');
							if (code) {
								await db.update(authCodes).set({ nonce }).where(eq(authCodes.code, code));
							}
						} catch { /* nonce save failed, non-critical for non-OIDC flows */ }
					}
					throw redirect(302, location);
				}
			}
			return fail(500, { errorKey: 'consent.err_generic' });
		} catch (e) {
			if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status < 400) throw e;
			return fail(400, { errorKey: 'consent.err_generic' });
		}
	},

	switchAccount: async ({ request, cookies }) => {
		const data = await request.formData();
		const pid = data.get('pid') as string;
		const oauthParams = pid ? getPendingOAuthParams(pid) : null;

		if (pid) deletePending(pid);
		await destroySession(cookies);

		throw redirect(302, oauthParams ? `/login?oauth=${encodeURIComponent(oauthParams)}` : '/login');
	},

	deny: async ({ request }) => {
		const data = await request.formData();
		const pid = data.get('pid') as string;

		const authRequest = getPending(pid);
		if (authRequest) {
			const redirectUri = authRequest.redirectUri;
			deletePending(pid);
			if (redirectUri) {
				const u = new URL(redirectUri);
				u.searchParams.set('error', 'access_denied');
				u.searchParams.set('error_description', 'The user denied the request.');
				if (authRequest.state) u.searchParams.set('state', authRequest.state);
				throw redirect(302, u.toString());
			}
		}
		throw redirect(302, '/');
	}
};
