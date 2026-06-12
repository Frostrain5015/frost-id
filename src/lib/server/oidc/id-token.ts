import { SignJWT } from 'jose';
import { createHash } from 'node:crypto';
import { APP_URL } from '$env/static/private';
import { db } from '$lib/server/db/client.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { getSigningKey, getKid } from './keys.js';

interface IdTokenParams {
	sub: string;
	clientId: string;
	scopes: string[];
	nonce?: string | null;
	accessToken: string;
}

export async function generateIdToken(params: IdTokenParams): Promise<string> {
	const { sub, clientId, scopes, nonce, accessToken } = params;

	const claims: Record<string, unknown> = {};

	// at_hash: left half of SHA-256 of the access_token, base64url-encoded
	const atHashFull = createHash('sha256').update(accessToken).digest();
	claims.at_hash = atHashFull.subarray(0, atHashFull.length / 2).toString('base64url');

	if (nonce) claims.nonce = nonce;

	// profile scope → username, picture
	// email scope → email, email_verified
	if (scopes.includes('profile') || scopes.includes('email')) {
		const [user] = await db
			.select({
				username: users.username,
				email: users.email,
				avatarUrl: users.avatarUrl
			})
			.from(users)
			.where(eq(users.id, sub))
			.limit(1);

		if (user) {
			if (scopes.includes('profile')) {
				claims.preferred_username = user.username;
				claims.username = user.username;
				if (user.avatarUrl) claims.picture = user.avatarUrl;
			}
			if (scopes.includes('email')) {
				claims.email = user.email;
				claims.email_verified = true;
			}
		}
	}

	const key = await getSigningKey();
	const kid = await getKid();
	const now = Math.floor(Date.now() / 1000);

	return new SignJWT(claims)
		.setProtectedHeader({ alg: 'RS256', kid })
		.setIssuer(APP_URL)
		.setSubject(sub)
		.setAudience(clientId)
		.setIssuedAt(now)
		.setExpirationTime(now + 3600)
		.sign(key);
}
