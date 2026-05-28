import { db } from '$lib/server/db/client.js';
import { clients } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const clientList = await db
		.select({
			id: clients.id,
			name: clients.name,
			scopes: clients.scopes,
			createdAt: clients.createdAt
		})
		.from(clients)
		.orderBy(clients.createdAt);

	return {
		user: locals.user!,
		clients: clientList
	};
};
