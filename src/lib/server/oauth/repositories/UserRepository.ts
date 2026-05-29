import type { OAuthClient, OAuthUser, OAuthUserRepository } from '@jmondi/oauth2-server';
import type { GrantIdentifier } from '@jmondi/oauth2-server';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/db/client.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export class UserRepository implements OAuthUserRepository {
	async getUserByCredentials(
		identifier: string,
		password: string,
		_grantType: GrantIdentifier,
		_client: OAuthClient
	): Promise<OAuthUser | undefined> {
		// During authorization_code grant, the library passes the user ID as
		// identifier with no password — just return { id } to propagate sub.
		if (!password) {
			return { id: identifier };
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, identifier))
			.limit(1);
		if (!user) return undefined;
		const valid = await bcrypt.compare(password, user.passwordHash);
		if (!valid) return undefined;
		return { id: user.id };
	}
}
