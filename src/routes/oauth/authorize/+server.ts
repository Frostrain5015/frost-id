import { redirect } from '@sveltejs/kit';
import { oauthRequest, oauthResponse, oauthErrorResponse } from '$lib/server/oauth/adapter.js';
import { authorizationServer } from '$lib/server/oauth/server.js';
import { storePending } from '$lib/server/oauth/pending.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, locals, url }) => {
	const req = await oauthRequest(request);

	let authRequest;
	try {
		authRequest = await authorizationServer.validateAuthorizationRequest(req);
	} catch (e) {
		return oauthErrorResponse(e);
	}

	if (!locals.user) {
		const params = url.searchParams.toString();
		throw redirect(302, `/login?oauth=${encodeURIComponent(params)}`);
	}

	authRequest.user = { id: locals.user.id };
	const pendingId = storePending(authRequest, url.searchParams.toString());
	throw redirect(302, `/consent?pid=${pendingId}`);
};
