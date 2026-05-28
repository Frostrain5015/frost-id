import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { clients, scopes } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [clientList, scopeList] = await Promise.all([
		db.select().from(clients).orderBy(clients.createdAt),
		db.select().from(scopes)
	]);
	return { clients: clientList, scopes: scopeList };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const redirectUrisRaw = (data.get('redirect_uris') as string)?.trim();
		const grantsRaw = data.getAll('grants') as string[];
		const scopesRaw = data.getAll('scopes') as string[];
		const isConfidential = data.get('confidential') === 'on';

		if (!name) return fail(400, { errorKey: 'clients.err_name' });

		const redirectUris = redirectUrisRaw
			.split('\n')
			.map((u) => u.trim())
			.filter(Boolean);

		if (!redirectUris.length) return fail(400, { errorKey: 'clients.err_redirect' });

		const secret = isConfidential ? nanoid(32) : null;

		await db.insert(clients).values({
			id: nanoid(36),
			name,
			secret,
			redirectUris,
			allowedGrants: grantsRaw.length ? grantsRaw : ['authorization_code'],
			scopes: scopesRaw
		});

		return { created: true, clientSecret: secret };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (id) await db.delete(clients).where(eq(clients.id, id));
		return { deleted: true };
	}
};
