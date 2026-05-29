import { fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/db/client.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const userList = await db
		.select({
			id: users.id,
			email: users.email,
			username: users.username,
			isAdmin: users.isAdmin,
			createdAt: users.createdAt
		})
		.from(users)
		.orderBy(users.createdAt);
	return { users: userList };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const username = (data.get('username') as string)?.trim();
		const email    = (data.get('email')    as string)?.trim().toLowerCase();
		const password =  data.get('password') as string;
		const isAdmin  =  data.get('admin') === 'on';

		if (!username || !email || !password) return fail(400, { errorKey: 'users.err_fields' });
		if (password.length < 8) return fail(400, { errorKey: 'users.err_password' });

		const passwordHash = await bcrypt.hash(password, 12);
		await db.insert(users).values({ id: nanoid(36), email, username, passwordHash, isAdmin });
		return { created: true };
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (id && id !== locals.user?.id) {
			await db.delete(users).where(eq(users.id, id));
		}
		return { deleted: true };
	}
};
