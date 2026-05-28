import { APP_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const issuer = APP_URL;
	return new Response(
		JSON.stringify({
			issuer,
			authorization_endpoint: `${issuer}/oauth/authorize`,
			token_endpoint: `${issuer}/oauth/token`,
			introspection_endpoint: `${issuer}/oauth/introspect`,
			revocation_endpoint: `${issuer}/oauth/revoke`,
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
			code_challenge_methods_supported: ['S256'],
			token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
			scopes_supported: ['openid', 'profile', 'email', 'offline_access']
		}),
		{ headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } }
	);
};
