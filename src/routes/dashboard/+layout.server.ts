import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			username: locals.user.username,
			avatarUrl: locals.user.avatarUrl,
			isAdmin: locals.user.isAdmin
		}
	};
};
