import { redirect } from '@sveltejs/kit';
import { github, google } from '$lib/server/social/providers.js';
import { createSocialState } from '$lib/server/social/state.js';
import { generateCodeVerifier, generateState } from 'arctic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { provider } = params;
	if (provider !== 'github' && provider !== 'google') {
		throw redirect(302, '/login');
	}

	const oauthParams = url.searchParams.get('oauth');
	const action = url.searchParams.get('action') === 'link' ? 'link' : 'login';

	if (action === 'link' && !locals.user) {
		throw redirect(302, '/login');
	}

	const codeVerifier = generateCodeVerifier();
	const state = generateState();

	await createSocialState(
		provider,
		codeVerifier.toString(),
		state,
		oauthParams,
		action,
		action === 'link' ? locals.user!.id : undefined
	);

	let authorizationUrl: URL;

	if (provider === 'github') {
		authorizationUrl = github.createAuthorizationURL(state, ['user:email']);
	} else {
		authorizationUrl = google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);
	}

	throw redirect(302, authorizationUrl.toString());
};
