import { APP_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const issuer = APP_URL;
	return new Response(
		JSON.stringify({
			issuer,
			authorization_endpoint: `${issuer}/oauth/authorize`,
			token_endpoint: `${issuer}/oauth/token`,
			userinfo_endpoint: `${issuer}/oauth/userinfo`,
			jwks_uri: `${issuer}/oauth/jwks`,
			introspection_endpoint: `${issuer}/oauth/introspect`,
			revocation_endpoint: `${issuer}/oauth/revoke`,
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
			subject_types_supported: ['public'],
			id_token_signing_alg_values_supported: ['RS256'],
			scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
			token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
			claims_supported: [
				'sub', 'iss', 'aud', 'exp', 'iat', 'nonce', 'at_hash',
				'email', 'email_verified',
				'preferred_username', 'username', 'picture'
			],
			code_challenge_methods_supported: ['S256']
		}),
		{ headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } }
	);
};
