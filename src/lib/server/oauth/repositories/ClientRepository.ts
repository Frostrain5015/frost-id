import type {
	OAuthClient,
	OAuthClientRepository
} from '@jmondi/oauth2-server';
import type { GrantIdentifier } from '@jmondi/oauth2-server';
import { db } from '$lib/server/db/client.js';
import { clients } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export class ClientRepository implements OAuthClientRepository {
	async getByIdentifier(clientId: string): Promise<OAuthClient> {
		const [client] = await db
			.select()
			.from(clients)
			.where(eq(clients.id, clientId))
			.limit(1);
		if (!client) throw new Error(`Client not found: ${clientId}`);
		return {
			id: client.id,
			name: client.name,
			secret: client.secret ?? undefined,
			redirectUris: client.redirectUris,
			allowedGrants: client.allowedGrants as GrantIdentifier[],
			scopes: client.scopes.map((name) => ({ name }))
		};
	}

	async isClientValid(
		grantType: GrantIdentifier,
		client: OAuthClient,
		clientSecret?: string
	): Promise<boolean> {
		if (!client.allowedGrants.includes(grantType)) return false;
		if (client.secret) {
			if (!clientSecret) return false;
			return client.secret === clientSecret;
		}
		return true;
	}
}
