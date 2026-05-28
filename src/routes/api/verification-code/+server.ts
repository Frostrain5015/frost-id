import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db/client.js';
import { verificationCodes, users } from '$lib/server/db/schema.js';
import { eq, lt, and } from 'drizzle-orm';
import { sendVerificationEmail } from '$lib/server/email.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { email } = await request.json();

	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json({ error: 'Invalid email address.' }, { status: 400 });
	}

	// Check if email already registered
	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email.toLowerCase()))
		.limit(1);
	if (existing) {
		return json({ error: 'An account with this email already exists.' }, { status: 409 });
	}

	// Rate-limit: mark old codes as expired
	await db
		.update(verificationCodes)
		.set({ used: true })
		.where(
			and(
				eq(verificationCodes.email, email.toLowerCase()),
				eq(verificationCodes.used, false)
			)
		);

	// Generate 6-digit code
	const code = String(100000 + Math.floor(Math.random() * 900000));
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

	await db.insert(verificationCodes).values({
		id: nanoid(36),
		email: email.toLowerCase(),
		code,
		expiresAt,
		used: false
	});

	// Send email
	try {
		await sendVerificationEmail(email, code);
	} catch (e) {
		console.error('[Frost ID] Failed to send verification email:', e);
		return json({ error: 'Failed to send email. Check SMTP configuration.' }, { status: 500 });
	}

	return json({ sent: true });
};
