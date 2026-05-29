import type { PageServerLoad } from './$types';

// The root "/" is the public Frost Tech ecosystem homepage for everyone.
// Logged-in users simply get an account menu in the nav (no redirect).
export const load: PageServerLoad = async ({ locals }) => {
	return { user: locals.user ?? null };
};
