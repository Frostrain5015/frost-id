import { db } from '$lib/server/db/client.js';
import { clients, accessTokens } from '$lib/server/db/schema.js';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	// Applications this user has authorized = distinct clients that hold a live
	// (non-revoked) access token issued to this user.
	const rows = await db
		.select({
			id: clients.id,
			name: clients.name,
			scopes: clients.scopes,
			grantedAt: accessTokens.createdAt
		})
		.from(accessTokens)
		.innerJoin(clients, eq(accessTokens.clientId, clients.id))
		.where(and(eq(accessTokens.userId, userId), eq(accessTokens.revoked, false)));

	// Collapse the per-token rows into one entry per client (latest grant wins).
	const byClient = new Map<string, { id: string; name: string; scopes: string[]; grantedAt: Date }>();
	for (const r of rows) {
		const prev = byClient.get(r.id);
		if (!prev || r.grantedAt > prev.grantedAt) {
			byClient.set(r.id, { id: r.id, name: r.name, scopes: r.scopes, grantedAt: r.grantedAt });
		}
	}
	const clientList = [...byClient.values()].sort(
		(a, b) => b.grantedAt.getTime() - a.grantedAt.getTime()
	);

	return { user: locals.user!, clients: clientList };
};

export const actions: Actions = {
	// Revoke the current user's authorization for a single app by marking all of
	// their tokens for that client as revoked.
	revoke: async ({ request, locals }) => {
		const data = await request.formData();
		const clientId = data.get('clientId') as string;
		if (clientId) {
			await db
				.update(accessTokens)
				.set({ revoked: true })
				.where(and(eq(accessTokens.userId, locals.user!.id), eq(accessTokens.clientId, clientId)));
		}
		return { revoked: true };
	}
};
