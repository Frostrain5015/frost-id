import { redirect } from '@sveltejs/kit';
import { github, google } from '$lib/server/social/providers.js';
import { consumeSocialState } from '$lib/server/social/state.js';
import { db } from '$lib/server/db/client.js';
import { users, linkedAccounts, pendingSocialRegistrations } from '$lib/server/db/schema.js';
import { configureOutboundProxy } from '$lib/server/outbound-proxy.js';
import { eq, and } from 'drizzle-orm';
import { createSession } from '$lib/server/session.js';
import { nanoid } from 'nanoid';
import type { RequestHandler } from './$types';

interface SocialProfile {
	id: string;
	email: string | null;
	displayName: string | null;
	avatarUrl: string | null;
	username: string | null;
}

async function handleGitHubCallback(code: string): Promise<SocialProfile> {
	const tokens = await github.validateAuthorizationCode(code);
	const accessToken = tokens.accessToken();

	const resp = await fetch('https://api.github.com/user', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	const ghUser = await resp.json() as Record<string, unknown>;

	let email: string | null = (ghUser.email as string) ?? null;
	if (!email) {
		const emailResp = await fetch('https://api.github.com/user/emails', {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		const emails = await emailResp.json() as Array<Record<string, unknown>>;
		const primary = emails.find(
			(e) => e.primary === true && e.verified === true
		);
		email = (primary?.email as string) ?? null;
	}

	return {
		id: String(ghUser.id),
		email,
		displayName: (ghUser.login as string) ?? (ghUser.name as string) ?? null,
		avatarUrl: (ghUser.avatar_url as string) ?? null,
		username: (ghUser.login as string) ?? null
	};
}

async function handleGoogleCallback(code: string, codeVerifier: string): Promise<SocialProfile> {
	const tokens = await google.validateAuthorizationCode(code, codeVerifier);
	const idToken = tokens.idToken();
	const parts = idToken.split('.');
	const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8')) as Record<string, unknown>;

	return {
		id: payload.sub as string,
		email: (payload.email as string) ?? null,
		displayName: (payload.name as string) ?? null,
		avatarUrl: (payload.picture as string) ?? null,
		username: null
	};
}

function generateUsername(displayName: string | null, email: string | null): string {
	let base = displayName ?? email?.split('@')[0] ?? 'user';
	base = base.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24).toLowerCase();
	if (base.length < 2) base = 'user';
	return base + '_' + nanoid(4);
}

function getClientIP(request: Request): string | undefined {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim();
	return undefined;
}

export const GET: RequestHandler = async ({ params, url, cookies, request, locals }) => {
	configureOutboundProxy();

	const { provider } = params;
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state) {
		console.warn(`[Frost ID] ${provider} callback missing code or state.`);
		throw redirect(302, '/login?error=social_failed');
	}

	const socialState = await consumeSocialState(state);
	if (!socialState || socialState.provider !== provider) {
		console.warn(`[Frost ID] ${provider} callback state mismatch or expired.`);
		throw redirect(302, '/login?error=social_failed');
	}

	let profile: SocialProfile;
	try {
		if (provider === 'github') {
			profile = await handleGitHubCallback(code);
		} else {
			profile = await handleGoogleCallback(code, socialState.codeVerifier);
		}
	} catch (e) {
		console.error(`[Frost ID] ${provider} callback error:`, e);
		throw redirect(302, '/login?error=social_failed');
	}

	if (!profile.email) {
		throw redirect(302, '/login?error=social_no_email');
	}

	// ─── LINK FLOW ──────────────────────────────────────────────
	if (socialState.action === 'link') {
		if (!locals.user || locals.user.id !== socialState.userId) {
			throw redirect(302, '/dashboard/account?error=link_unauthorized');
		}

		// Check if already linked to another user
		const [existing] = await db
			.select()
			.from(linkedAccounts)
			.where(
				and(
					eq(linkedAccounts.provider, provider),
					eq(linkedAccounts.providerAccountId, profile.id)
				)
			)
			.limit(1);

		if (existing) {
			throw redirect(302, '/dashboard/account?error=link_already_used');
		}

		// Also check if this provider is already linked to this user
		const [existingOwn] = await db
			.select()
			.from(linkedAccounts)
			.where(
				and(
					eq(linkedAccounts.userId, locals.user.id),
					eq(linkedAccounts.provider, provider)
				)
			)
			.limit(1);

		if (existingOwn) {
			throw redirect(302, '/dashboard/account?error=link_already_linked');
		}

		await db.insert(linkedAccounts).values({
			id: nanoid(36),
			userId: locals.user.id,
			provider,
			providerAccountId: profile.id,
			displayName: profile.displayName,
			email: profile.email,
			avatarUrl: profile.avatarUrl,
			accessToken: null,
			refreshToken: null,
			expiresAt: null
		});

		throw redirect(302, '/dashboard/account?linked=' + provider);
	}

	// ─── LOGIN FLOW ─────────────────────────────────────────────

	// 1. Check if social account is already linked to a Frost ID user
	const [linked] = await db
		.select()
		.from(linkedAccounts)
		.where(
			and(
				eq(linkedAccounts.provider, provider),
				eq(linkedAccounts.providerAccountId, profile.id)
			)
		)
		.limit(1);

	if (linked) {
		// Existing linked account — just log in
		const ip = getClientIP(request);
		await createSession(linked.userId, cookies, ip);

		if (socialState.oauthParams) {
			throw redirect(302, `/oauth/authorize?${socialState.oauthParams}`);
		}
		throw redirect(302, '/dashboard');
	}

	// 2. Try to match by email (account merging)
	const [existingUser] = await db
		.select()
		.from(users)
		.where(eq(users.email, profile.email))
		.limit(1);

	if (existingUser) {
		// Link the social account to the existing user
		await db.insert(linkedAccounts).values({
			id: nanoid(36),
			userId: existingUser.id,
			provider,
			providerAccountId: profile.id,
			displayName: profile.displayName,
			email: profile.email,
			avatarUrl: profile.avatarUrl,
			accessToken: null,
			refreshToken: null,
			expiresAt: null
		});

		const ip = getClientIP(request);
		await createSession(existingUser.id, cookies, ip);

		if (socialState.oauthParams) {
			throw redirect(302, `/oauth/authorize?${socialState.oauthParams}`);
		}
		throw redirect(302, '/dashboard');
	}

	// 3. No match — new user, redirect to "complete registration" page
	const username = generateUsername(profile.username ?? profile.displayName, profile.email);
	const pendingId = nanoid(36);
	const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

	await db.insert(pendingSocialRegistrations).values({
		id: pendingId,
		email: profile.email,
		username,
		avatarUrl: profile.avatarUrl,
		provider,
		providerAccountId: profile.id,
		displayName: profile.displayName,
		oauthParams: socialState.oauthParams || null,
		expiresAt
	});

	throw redirect(302, `/auth/complete-registration?token=${pendingId}`);
};
