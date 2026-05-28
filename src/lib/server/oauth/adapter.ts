import { requestFromVanilla, responseToVanilla, handleVanillaError } from '@jmondi/oauth2-server/vanilla';
import { OAuthException, type OAuthResponse } from '@jmondi/oauth2-server';

export { requestFromVanilla as oauthRequest };

export function oauthResponse(response: unknown): Response {
	return responseToVanilla(response as OAuthResponse);
}

export function oauthErrorResponse(e: unknown): Response {
	if (e instanceof OAuthException) {
		return responseToVanilla(handleVanillaError(e));
	}
	throw e;
}
