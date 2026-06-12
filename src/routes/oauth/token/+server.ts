import { requestFromVanilla, responseToVanilla, handleVanillaError } from '@jmondi/oauth2-server/vanilla';
import { OAuthException, type OAuthResponse } from '@jmondi/oauth2-server';
import { authorizationServer } from '$lib/server/oauth/server.js';
import { generateIdToken } from '$lib/server/oidc/id-token.js';
import { db } from '$lib/server/db/client.js';
import { authCodes } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.clone().text();
	const params = new URLSearchParams(body);
	const grantType = params.get('grant_type');
	const code = params.get('code');

	const req = await requestFromVanilla(request);
	try {
		const oauthRes = await authorizationServer.respondToAccessTokenRequest(req);
		const vanillaRes = responseToVanilla(oauthRes);

		if (grantType === 'authorization_code' && code) {
			return await maybeInjectIdToken(vanillaRes, code);
		}

		return vanillaRes;
	} catch (e) {
		if (e instanceof OAuthException) {
			return responseToVanilla(handleVanillaError(e));
		}
		throw e;
	}
};

async function maybeInjectIdToken(response: Response, code: string): Promise<Response> {
	try {
		const [authCode] = await db
			.select({
				userId: authCodes.userId,
				clientId: authCodes.clientId,
				scopes: authCodes.scopes,
				nonce: authCodes.nonce
			})
			.from(authCodes)
			.where(eq(authCodes.code, code))
			.limit(1);

		if (!authCode?.userId || !authCode.scopes.includes('openid')) {
			return response;
		}

		const tokenBody = await response.json() as Record<string, unknown>;

		const idToken = await generateIdToken({
			sub: authCode.userId,
			clientId: authCode.clientId,
			scopes: authCode.scopes,
			nonce: authCode.nonce,
			accessToken: String(tokenBody.access_token ?? '')
		});

		tokenBody.id_token = idToken;

		return new Response(JSON.stringify(tokenBody), {
			status: response.status,
			headers: response.headers
		});
	} catch {
		return response;
	}
}
