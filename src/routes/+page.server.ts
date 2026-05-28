import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.isAdmin) throw redirect(302, '/admin');
	if (locals.user) throw redirect(302, '/dashboard');
	throw redirect(302, '/login');
};
