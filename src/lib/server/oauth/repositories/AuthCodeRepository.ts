import type {
	OAuthAuthCode,
	OAuthAuthCodeRepository,
	OAuthClient,
	OAuthScope,
	OAuthUser
} from '@jmondi/oauth2-server';
import type { CodeChallengeMethod } from '@jmondi/oauth2-server';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { authCodes, clients, users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export class AuthCodeRepository implements OAuthAuthCodeRepository {
	async getByIdentifier(code: string): Promise<OAuthAuthCode> {
		const [row] = await db
			.select()
			.from(authCodes)
			.where(eq(authCodes.code, code))
			.limit(1);
		if (!row) throw new Error(`Auth code not found: ${code}`);

		const [client] = await db
			.select()
			.from(clients)
			.where(eq(clients.id, row.clientId))
			.limit(1);
		if (!client) throw new Error('Client not found');

		let user: OAuthUser | undefined;
		if (row.userId) {
			const [u] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
			if (u) user = { id: u.id };
		}

		return {
			code: row.code,
			redirectUri: row.redirectUri ?? undefined,
			codeChallenge: row.codeChallenge ?? undefined,
			codeChallengeMethod: (row.codeChallengeMethod as CodeChallengeMethod) ?? undefined,
			expiresAt: row.expiresAt,
			user,
			client: {
				id: client.id,
				name: client.name,
				secret: client.secret ?? undefined,
				redirectUris: client.redirectUris,
				allowedGrants: client.allowedGrants as never[],
				scopes: client.scopes.map((name) => ({ name }))
			},
			scopes: row.scopes.map((name) => ({ name }))
		};
	}

	async issueAuthCode(
		client: OAuthClient,
		user: OAuthUser | undefined,
		scopes: OAuthScope[]
	): Promise<OAuthAuthCode> {
		const code = nanoid(64);
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
		return {
			code,
			expiresAt,
			user,
			client,
			scopes,
			redirectUri: undefined,
			codeChallenge: undefined,
			codeChallengeMethod: undefined
		};
	}

	async persist(authCode: OAuthAuthCode): Promise<void> {
		await db.insert(authCodes).values({
			code: authCode.code,
			clientId: authCode.client.id,
			redirectUri: authCode.redirectUri ?? null,
			codeChallenge: authCode.codeChallenge ?? null,
			codeChallengeMethod: authCode.codeChallengeMethod ?? null,
			scopes: authCode.scopes.map((s) => s.name),
			expiresAt: authCode.expiresAt,
			revoked: false,
			userId: authCode.user?.id != null ? String(authCode.user.id) : null
		});
	}

	async isRevoked(code: string): Promise<boolean> {
		const [row] = await db
			.select({ revoked: authCodes.revoked })
			.from(authCodes)
			.where(eq(authCodes.code, code))
			.limit(1);
		return row?.revoked ?? true;
	}

	async revoke(code: string): Promise<void> {
		await db.update(authCodes).set({ revoked: true }).where(eq(authCodes.code, code));
	}
}
