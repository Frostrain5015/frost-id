import { oauthRequest, oauthResponse, oauthErrorResponse } from '$lib/server/oauth/adapter.js';
import { authorizationServer } from '$lib/server/oauth/server.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const req = await oauthRequest(request);
	try {
		const res = await authorizationServer.revoke(req);
		return oauthResponse(res);
	} catch (e) {
		return oauthErrorResponse(e);
	}
};
