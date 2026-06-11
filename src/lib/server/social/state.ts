import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { socialOAuthStates } from '$lib/server/db/schema.js';
import { eq, lt } from 'drizzle-orm';

export async function createSocialState(
	provider: string,
	codeVerifier: string,
	state: string,
	oauthParams: string | null,
	action: 'login' | 'link',
	userId?: string
): Promise<string> {
	const id = nanoid(36);
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
	await db.insert(socialOAuthStates).values({
		id,
		provider,
		codeVerifier,
		state,
		oauthParams: oauthParams || null,
		action,
		userId: userId || null,
		expiresAt
	});
	return id;
}

export async function consumeSocialState(state: string): Promise<{
	provider: string;
	codeVerifier: string;
	oauthParams: string | null;
	action: 'login' | 'link';
	userId: string | null;
} | null> {
	const [row] = await db
		.select()
		.from(socialOAuthStates)
		.where(eq(socialOAuthStates.state, state))
		.limit(1);
	if (!row || row.expiresAt < new Date()) {
		if (row) await db.delete(socialOAuthStates).where(eq(socialOAuthStates.id, row.id));
		return null;
	}
	await db.delete(socialOAuthStates).where(eq(socialOAuthStates.id, row.id));
	return {
		provider: row.provider,
		codeVerifier: row.codeVerifier,
		oauthParams: row.oauthParams,
		action: row.action as 'login' | 'link',
		userId: row.userId
	};
}

/** Cleanup expired states (called periodically from hooks). */
export async function cleanupExpiredSocialStates(): Promise<void> {
	await db.delete(socialOAuthStates).where(lt(socialOAuthStates.expiresAt, new Date()));
}
