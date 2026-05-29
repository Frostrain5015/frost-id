import { getSessionUser, ensureSeeded } from '$lib/server/session.js';
import type { Handle } from '@sveltejs/kit';

let seeded = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!seeded) {
		try {
			await ensureSeeded();
			seeded = true;
		} catch {
			// DB not ready yet; will retry on next request
		}
	}

	const user = await getSessionUser(event.cookies);
	if (user) {
		event.locals.user = {
			id: user.id,
			email: user.email,
			username: user.username,
			avatarUrl: user.avatarUrl,
			isAdmin: user.isAdmin
		};
	}

	return resolve(event);
};
