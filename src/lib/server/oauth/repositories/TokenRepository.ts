import type {
	OAuthClient,
	OAuthScope,
	OAuthToken,
	OAuthTokenRepository,
	OAuthUser
} from '@jmondi/oauth2-server';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { accessTokens, clients } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export class TokenRepository implements OAuthTokenRepository {
	async issueToken(
		client: OAuthClient,
		scopes: OAuthScope[],
		user?: OAuthUser
	): Promise<OAuthToken> {
		return {
			accessToken: nanoid(64),
			accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
			client,
			user,
			scopes
		};
	}

	async issueRefreshToken(accessToken: OAuthToken): Promise<OAuthToken> {
		return {
			...accessToken,
			refreshToken: nanoid(64),
			refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
		};
	}

	async persist(token: OAuthToken): Promise<void> {
		await db.insert(accessTokens).values({
			accessToken: token.accessToken,
			accessTokenExpiresAt: token.accessTokenExpiresAt,
			refreshToken: token.refreshToken ?? null,
			refreshTokenExpiresAt: token.refreshTokenExpiresAt ?? null,
			clientId: token.client.id,
			userId: token.user?.id != null ? String(token.user.id) : null,
			scopes: token.scopes.map((s) => s.name),
			revoked: false
		});
	}

	async revoke(token: OAuthToken): Promise<void> {
		await db
			.update(accessTokens)
			.set({ revoked: true })
			.where(eq(accessTokens.accessToken, token.accessToken));
	}

	async isRefreshTokenRevoked(token: OAuthToken): Promise<boolean> {
		if (!token.refreshToken) return true;
		const [row] = await db
			.select({ revoked: accessTokens.revoked })
			.from(accessTokens)
			.where(eq(accessTokens.refreshToken, token.refreshToken))
			.limit(1);
		return row?.revoked ?? true;
	}

	async getByRefreshToken(refreshToken: string): Promise<OAuthToken> {
		const [row] = await db
			.select()
			.from(accessTokens)
			.where(eq(accessTokens.refreshToken, refreshToken))
			.limit(1);
		if (!row) throw new Error('Refresh token not found');

		const [client] = await db
			.select()
			.from(clients)
			.where(eq(clients.id, row.clientId))
			.limit(1);
		if (!client) throw new Error('Client not found');

		return {
			accessToken: row.accessToken,
			accessTokenExpiresAt: row.accessTokenExpiresAt,
			refreshToken: row.refreshToken ?? undefined,
			refreshTokenExpiresAt: row.refreshTokenExpiresAt ?? undefined,
			client: {
				id: client.id,
				name: client.name,
				secret: client.secret ?? undefined,
				redirectUris: client.redirectUris,
				allowedGrants: client.allowedGrants as never[],
				scopes: client.scopes.map((n) => ({ name: n }))
			},
			user: row.userId ? { id: row.userId } : undefined,
			scopes: row.scopes.map((n) => ({ name: n }))
		};
	}
}
