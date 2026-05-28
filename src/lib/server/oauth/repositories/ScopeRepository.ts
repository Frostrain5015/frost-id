import type { OAuthClient, OAuthScope, OAuthScopeRepository } from '@jmondi/oauth2-server';
import type { GrantIdentifier } from '@jmondi/oauth2-server';
import { db } from '$lib/server/db/client.js';
import { scopes } from '$lib/server/db/schema.js';
import { inArray } from 'drizzle-orm';

export class ScopeRepository implements OAuthScopeRepository {
	async getAllByIdentifiers(scopeNames: string[]): Promise<OAuthScope[]> {
		if (!scopeNames.length) return [];
		const rows = await db
			.select()
			.from(scopes)
			.where(inArray(scopes.name, scopeNames));
		return rows.map((r) => ({ name: r.name }));
	}

	async finalize(
		requestedScopes: OAuthScope[],
		_identifier: GrantIdentifier,
		client: OAuthClient,
		_userId?: string
	): Promise<OAuthScope[]> {
		const clientScopeNames = client.scopes.map((s) => s.name);
		return requestedScopes.filter((s) => clientScopeNames.includes(s.name));
	}
}
