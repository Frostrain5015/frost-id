import { getSessionUser, ensureSeeded } from '$lib/server/session.js';
import { cleanupExpiredSocialStates } from '$lib/server/social/state.js';
import { db } from '$lib/server/db/client.js';
import { pendingSocialRegistrations } from '$lib/server/db/schema.js';
import { lt } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

let seeded = false;
let lastCleanup = 0;

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

	// Periodic cleanup of expired social OAuth states and pending registrations
	const now = Date.now();
	if (now - lastCleanup > 10 * 60 * 1000) {
		lastCleanup = now;
		cleanupExpiredSocialStates().catch(() => {});
		try {
			await db.delete(pendingSocialRegistrations).where(lt(pendingSocialRegistrations.expiresAt, new Date()));
		} catch {
			// cleanup failed, non-critical
		}
	}

	return resolve(event);
};
